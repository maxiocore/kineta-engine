import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

import OrdersStatsCards from "@/components/orders/OrdersStatsCards";
import OrdersAdvancedFilters from "@/components/orders/OrdersAdvancedFilters";
import OrderCard from "@/components/orders/OrderCard";
import OrderDetailsDialog from "@/components/orders/OrderDetailsDialog";

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  features: any;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  link: string | null;
  quantity: number | null;
  external_order_id: string | null;
  external_status: string | null;
  discount_amount: number | null;
  service: Service;
}

interface OrderStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ClientOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
      const channel = supabase
        .channel('client-orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(order => order.id === payload.new.id ? { ...order, ...payload.new } : order));
              if (selectedOrder && selectedOrder.id === payload.new.id) {
                setSelectedOrder(prev => prev ? { ...prev, ...payload.new } : null);
                fetchOrderHistory(payload.new.id as string);
              }
              toast.info("تم تحديث حالة طلبك");
            } else if (payload.eventType === 'INSERT') {
              fetchOrders();
            }
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, selectedOrder]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`id, order_number, status, total_price, notes, admin_notes, created_at, updated_at, link, quantity, external_order_id, external_status, discount_amount, service:services(id, name, price, category, description, features)`)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("خطأ في جلب الطلبات");
    else setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const fetchOrderHistory = async (orderId: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase.from("order_status_history").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
    if (!error && data) setOrderHistory(data);
    setLoadingHistory(false);
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    fetchOrderHistory(order.id);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("تم تحديث الطلبات");
  };

  const handleExport = () => {
    const csv = orders.map(o => `${o.order_number},${o.service?.name},${o.status},${o.total_price},${o.created_at}`).join('\n');
    const blob = new Blob([`رقم الطلب,الخدمة,الحالة,السعر,التاريخ\n${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    toast.success("تم تصدير الطلبات");
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || order.service?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const orderDate = new Date(order.created_at);
    const matchesDate = (!dateRange.from && !dateRange.to) || (dateRange.from && dateRange.to && isWithinInterval(orderDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) })) || (dateRange.from && !dateRange.to && orderDate >= startOfDay(dateRange.from));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    in_progress: orders.filter(o => o.status === "in_progress" || o.status === "processing").length,
    completed: orders.filter(o => o.status === "completed").length,
  };
  const totalSpent = orders.reduce((sum, o) => sum + o.total_price, 0);

  return (
    <ClientDashboardLayout>
      <motion.div className="space-y-6 pb-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/20 via-primary/10 to-accent/20 p-6 md:p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div className="relative" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                  <ShoppingBag className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-success-foreground" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">طلباتي</h1>
                <p className="text-muted-foreground">إدارة ومتابعة جميع طلباتك في الوقت الفعلي</p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => navigate('/dashboard/our-services')} className="h-12 px-6 gap-3 btn-brand rounded-xl">
                <ShoppingBag className="w-5 h-5" />
                طلب جديد
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants}>
          <OrdersStatsCards stats={stats} totalSpent={totalSpent} />
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <OrdersAdvancedFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={handleRefresh}
            onExport={handleExport}
            isRefreshing={isRefreshing}
            filteredCount={filteredOrders.length}
            totalCount={orders.length}
          />
        </motion.div>

        {/* Orders List */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent border-b border-border/50">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-lg">قائمة الطلبات</span>
                  <Badge variant="secondary" className="mr-3">{filteredOrders.length}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">لا توجد طلبات</p>
                  <p className="text-sm text-muted-foreground/70 mb-4">ابدأ بإنشاء طلبك الأول</p>
                  <Button onClick={() => navigate('/dashboard/our-services')} className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    طلب جديد
                  </Button>
                </motion.div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <AnimatePresence>
                    {filteredOrders.map((order, index) => (
                      <OrderCard key={order.id} order={order} index={index} onClick={() => handleViewOrder(order)} />
                    ))}
                  </AnimatePresence>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Details Dialog */}
        <OrderDetailsDialog
          order={selectedOrder}
          orderHistory={orderHistory}
          loadingHistory={loadingHistory}
          onClose={() => setSelectedOrder(null)}
        />
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;
