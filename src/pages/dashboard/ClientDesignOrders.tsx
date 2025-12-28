import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Palette, Plus, Brush, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { 
  ModernOrdersStats, 
  ModernOrdersSearch,
  DesignOrdersList
} from "@/components/orders/modern";

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
  start_count: number | null;
  remains: number | null;
  service: Service;
}

const designCategories = [
  'design', 'graphic', 'logo', 'banner', 'poster', 'branding',
  'ui', 'ux', 'illustration', 'motion', 'video', 'animation'
];

const isDesignOrder = (category: string): boolean => {
  const lowerCategory = category?.toLowerCase() || '';
  return designCategories.some(c => lowerCategory.includes(c));
};

const ClientDesignOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
      const channel = supabase
        .channel('client-design-orders-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders', 
          filter: `user_id=eq.${user.id}` 
        }, () => fetchOrders())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, notes, admin_notes, 
        created_at, updated_at, link, quantity, external_order_id, 
        external_status, discount_amount, start_count, remains,
        service:services(id, name, price, category, description, features)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    
    if (error) toast.error("خطأ في جلب الطلبات");
    else {
      const allOrders = data as unknown as Order[];
      const designOrders = allOrders.filter(o => isDesignOrder(o.service?.category));
      setOrders(designOrders);
    }
    setLoading(false);
  };

  const handleViewOrder = (order: Order) => {
    navigate(`/dashboard/orders/${order.id}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success("تم تحديث الطلبات");
  };

  const handleExport = () => {
    const csv = orders.map(o => 
      `${o.order_number},${o.service?.name},${o.status},${o.total_price},${o.created_at}`
    ).join('\n');
    const blob = new Blob([`رقم الطلب,الخدمة,الحالة,السعر,التاريخ\n${csv}`], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-orders.csv';
    a.click();
    toast.success("تم تصدير الطلبات");
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.service?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      const orderDate = new Date(order.created_at);
      const matchesDate = 
        (!dateRange.from && !dateRange.to) || 
        (dateRange.from && dateRange.to && isWithinInterval(orderDate, { 
          start: startOfDay(dateRange.from), 
          end: endOfDay(dateRange.to) 
        })) || 
        (dateRange.from && !dateRange.to && orderDate >= startOfDay(dateRange.from));
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, dateRange]);

  const stats = useMemo(() => ({
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === "pending").length,
    in_progress: filteredOrders.filter(o => o.status === "in_progress" || o.status === "processing").length,
    completed: filteredOrders.filter(o => o.status === "completed").length,
    cancelled: filteredOrders.filter(o => o.status === "cancelled" || o.status === "refunded").length,
  }), [filteredOrders]);

  const totalSpent = useMemo(() => 
    filteredOrders
      .filter(o => o.status === 'completed' || o.status === 'in_progress' || o.status === 'processing')
      .reduce((sum, o) => sum + o.total_price, 0), 
    [filteredOrders]
  );

  const todaySpent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredOrders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= today && 
          (o.status === 'completed' || o.status === 'in_progress' || o.status === 'processing');
      })
      .reduce((sum, o) => sum + o.total_price, 0);
  }, [filteredOrders]);

  return (
    <ClientDashboardLayout>
      <motion.div 
        className="space-y-4 md:space-y-6 pb-8" 
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-l from-violet-500/15 via-purple-500/5 to-transparent p-4 md:p-6 border border-violet-500/20"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Palette className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center">
                  <Brush className="w-3 h-3 text-violet-500" />
                </div>
              </motion.div>
              
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">طلبات التصميم</h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                  سجل طلبات خدمات التصميم
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard/orders')} 
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                كل الطلبات
              </Button>
              <Button 
                onClick={() => navigate('/dashboard/design-services')} 
                className="gap-2 bg-gradient-to-l from-violet-500 to-purple-500 hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                طلب جديد
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ModernOrdersStats stats={stats} totalSpent={totalSpent} todaySpent={todaySpent} />
        </motion.div>

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <ModernOrdersSearch
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

        {/* Orders List - Design specific view */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <DesignOrdersList
            orders={filteredOrders}
            loading={loading}
            onViewOrder={handleViewOrder}
            emptyTitle="لا توجد طلبات تصميم"
            emptyDescription="اطلب خدمات التصميم الآن"
          />
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientDesignOrders;
