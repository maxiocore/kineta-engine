import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Loader2, Activity, CheckCircle, AlertCircle, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

import { 
  AdminOrdersHeader, 
  AdminOrdersStats, 
  AdminOrdersSectionCards, 
  AdminSectionHeader,
  AdminOrdersSearch,
  type AdminOrderType 
} from "@/components/admin/orders/modern";
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

// Category mappings
const designCategories = ['design', 'graphic', 'logo', 'banner', 'poster', 'branding', 'ui', 'ux', 'illustration', 'motion', 'video', 'animation', 'تصميم'];
const devCategories = ['development', 'programming', 'web', 'app', 'mobile', 'software', 'backend', 'frontend', 'api', 'database', 'code', 'script', 'برمجة', 'تطوير', 'موقع', 'تطبيق'];

const getOrderType = (category: string): AdminOrderType => {
  const lowerCategory = category?.toLowerCase() || '';
  if (designCategories.some(c => lowerCategory.includes(c))) return 'design';
  if (devCategories.some(c => lowerCategory.includes(c))) return 'dev';
  return 'other';
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
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
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [activeSection, setActiveSection] = useState<AdminOrderType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      if (oldStatus !== status) {
        try {
          await supabase.functions.invoke('notify-order-status', { body: { orderId, oldStatus, newStatus: status } });
        } catch (e) { console.error("Failed to send status notification:", e); }
      }
      toast.success("تم تحديث الطلب بنجاح"); 
      setSelectedOrder(null); 
      fetchOrders(); 
    }
    setUpdating(false);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    const ordersToUpdate = orders.filter(o => selectedIds.includes(o.id));
    
    const { error } = await supabase.from("orders").update({ status: status as any, updated_at: new Date().toISOString() }).in("id", selectedIds);
    if (error) toast.error("خطأ في تحديث الطلبات");
    else { 
      for (const order of ordersToUpdate) {
        if (order.status !== status) {
          try { await supabase.functions.invoke('notify-order-status', { body: { orderId: order.id, oldStatus: order.status, newStatus: status } }); } catch (e) { console.error("Failed to send status notification:", e); }
        }
      }
      toast.success(`تم تحديث ${selectedIds.length} طلب`); 
      setSelectedIds([]); 
      fetchOrders(); 
    }
  };

  const openOrderDetails = async (order: Order) => { setSelectedOrder(order); await fetchOrderHistory(order.id); };
  const resetFilters = () => { setStatusFilter("all"); setServiceFilter("all"); setDateFrom(undefined); setDateTo(undefined); setSearchQuery(""); };
  const openDeleteDialog = (id: string) => { setDeletingId(id); setDeleteType("single"); setDeleteDialogOpen(true); };
  const openBulkDeleteDialog = () => { if (selectedIds.length === 0) return; setDeleteType("bulk"); setDeleteDialogOpen(true); };
  const openCancelDialog = (order: Order) => { setCancellingOrder(order); setCancelDialogOpen(true); };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancelling(true);
    try {
      const { error } = await supabase.from("orders").update({ status: 'cancelled' as any, updated_at: new Date().toISOString() }).eq("id", cancellingOrder.id);
      if (error) throw error;
      toast.success(`تم إلغاء الطلب ${cancellingOrder.order_number} واسترداد المبلغ $${cancellingOrder.total_price}`);
      fetchOrders();
    } catch (error) { toast.error("فشل في إلغاء الطلب"); }
    finally { setCancelling(false); setCancelDialogOpen(false); setCancellingOrder(null); }
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("تم تحديث الطلبات");
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

  // Orders by type
  const ordersByType = useMemo(() => {
    const result = { all: orders, design: [] as Order[], dev: [] as Order[], other: [] as Order[] };
    orders.forEach(order => {
      const type = getOrderType(order.service?.category || '');
      result[type].push(order);
    });
    return result;
  }, [orders]);

  const typeCounts = useMemo(() => ({
    all: orders.length,
    design: ordersByType.design.length,
    dev: ordersByType.dev.length,
    other: ordersByType.other.length,
  }), [orders, ordersByType]);

  const currentSectionOrders = activeSection ? ordersByType[activeSection] : [];

  const filteredOrders = useMemo(() => {
    const ordersToFilter = activeSection ? currentSectionOrders : orders;
    return ordersToFilter.filter(order => {
      const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesService = serviceFilter === "all" || order.service?.id === serviceFilter;
      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !dateFrom || !isBefore(orderDate, startOfDay(dateFrom));
      const matchesDateTo = !dateTo || !isAfter(orderDate, endOfDay(dateTo));
      return matchesSearch && matchesStatus && matchesService && matchesDateFrom && matchesDateTo;
    });
  }, [orders, currentSectionOrders, activeSection, searchQuery, statusFilter, serviceFilter, dateFrom, dateTo]);

  return (
    <AdminDashboardLayout>
      <TooltipProvider>
        <motion.div 
          className="space-y-4 pb-8" 
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="wait">
            {!activeSection ? (
              <motion.div
                key="section-cards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <AdminOrdersHeader
                  newOrdersCount={newOrdersCount}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                  syncing={syncing}
                  onSync={handleSyncOrdersStatus}
                  onExport={exportOrders}
                />
                
                <AdminOrdersStats stats={stats} />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">اختر قسم لإدارة الطلبات</h3>
                      <p className="text-sm text-muted-foreground">انقر على أي قسم لعرض وإدارة جميع الطلبات المتعلقة به</p>
                    </div>
                  </div>
                </motion.div>

                <AdminOrdersSectionCards
                  activeSection={null}
                  onSectionClick={(section) => setActiveSection(section)}
                  counts={typeCounts}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`section-${activeSection}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-4"
              >
                <AdminSectionHeader
                  section={activeSection}
                  count={typeCounts[activeSection]}
                  onBack={() => { setActiveSection(null); resetFilters(); setSelectedIds([]); }}
                />

                <AdminOrdersStats stats={{
                  ...stats,
                  total: filteredOrders.length,
                  pending: filteredOrders.filter(o => o.status === "pending").length,
                  in_progress: filteredOrders.filter(o => o.status === "in_progress" || o.status === "processing").length,
                  completed: filteredOrders.filter(o => o.status === "completed").length,
                  cancelled: filteredOrders.filter(o => o.status === "cancelled" || o.status === "refunded").length,
                  totalRevenue: filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
                }} />

                <Card className="border-border/40">
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <AdminOrdersSearch
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      serviceFilter={serviceFilter}
                      setServiceFilter={setServiceFilter}
                      dateFrom={dateFrom}
                      setDateFrom={setDateFrom}
                      dateTo={dateTo}
                      setDateTo={setDateTo}
                      onRefresh={handleRefresh}
                      isRefreshing={isRefreshing}
                      filteredCount={filteredOrders.length}
                      totalCount={currentSectionOrders.length}
                      services={services}
                    />
                    <BulkActionsBar selectedCount={selectedIds.length} onStatusUpdate={handleBulkStatusUpdate} onExport={exportOrders} onDelete={openBulkDeleteDialog} onClear={() => setSelectedIds([])} statusOptions={statusOptions} />
                  </CardContent>
                </Card>

                <OrdersList orders={filteredOrders} loading={loading} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} onViewOrder={openOrderDetails} onDeleteOrder={openDeleteDialog} onCancelOrder={openCancelDialog} />
              </motion.div>
            )}
          </AnimatePresence>

          <OrderDetailsDialog order={selectedOrder} orderHistory={orderHistory} open={!!selectedOrder} onClose={() => setSelectedOrder(null)} onSave={handleUpdateOrder} onCancel={(order) => { setSelectedOrder(null); openCancelDialog(order); }} saving={updating} />
          <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title={deleteType === "single" ? "حذف الطلب" : `حذف ${selectedIds.length} طلب`} description="هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء." onConfirm={handleConfirmDelete} loading={deleting} />
          <ConfirmDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen} title="إلغاء الطلب واسترداد الرصيد" description={cancellingOrder ? `هل تريد إلغاء الطلب ${cancellingOrder.order_number} واسترداد مبلغ $${cancellingOrder.total_price} لرصيد العميل؟` : ""} onConfirm={handleCancelOrder} loading={cancelling} />
        </motion.div>
      </TooltipProvider>
    </AdminDashboardLayout>
  );
};

export default AdminOrders;
