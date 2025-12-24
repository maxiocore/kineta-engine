import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, Sparkles, Plus, Share2, Palette, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

import { 
  OrdersTypeTabs, 
  OrderType, 
  ModernOrdersStats, 
  ModernOrdersSearch,
  ModernOrdersList,
  ModernOrdersTable,
  DesignOrdersList,
  DevOrdersList
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
  service: Service;
}

interface OrderStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
}

// Define category mappings for order types
const socialCategories = [
  'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 
  'telegram', 'linkedin', 'pinterest', 'social', 'smm', 'followers',
  'likes', 'views', 'comments', 'shares', 'subscribers'
];

const designCategories = [
  'design', 'graphic', 'logo', 'banner', 'poster', 'branding',
  'ui', 'ux', 'illustration', 'motion', 'video', 'animation'
];

const devCategories = [
  'development', 'programming', 'web', 'app', 'mobile', 'software',
  'backend', 'frontend', 'api', 'database', 'code', 'script'
];

const getOrderType = (category: string): OrderType => {
  const lowerCategory = category?.toLowerCase() || '';
  
  if (socialCategories.some(c => lowerCategory.includes(c))) return 'social';
  if (designCategories.some(c => lowerCategory.includes(c))) return 'design';
  if (devCategories.some(c => lowerCategory.includes(c))) return 'dev';
  
  return 'social'; // Default to social for SMM services
};

const ClientOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeType, setActiveType] = useState<OrderType>("all");

  useEffect(() => {
    if (user) {
      fetchOrders();
      const channel = supabase
        .channel('client-orders-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders', 
          filter: `user_id=eq.${user.id}` 
        },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(order => 
                order.id === payload.new.id ? { ...order, ...payload.new } : order
              ));
              toast.info("تم تحديث حالة طلبك");
            } else if (payload.eventType === 'INSERT') {
              fetchOrders();
            }
          }
        )
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
        external_status, discount_amount, 
        service:services(id, name, price, category, description, features)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    
    if (error) toast.error("خطأ في جلب الطلبات");
    else setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const handleViewOrder = async (order: Order) => {
    // Navigate to order details page instead of opening sheet
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
    a.download = 'orders.csv';
    a.click();
    toast.success("تم تصدير الطلبات");
  };

  // Filter orders by type
  const ordersByType = useMemo(() => {
    const result = { all: orders, social: [] as Order[], design: [] as Order[], dev: [] as Order[] };
    
    orders.forEach(order => {
      const type = getOrderType(order.service?.category);
      result[type].push(order);
    });
    
    return result;
  }, [orders]);

  // Get current type orders
  const currentTypeOrders = activeType === 'all' ? orders : ordersByType[activeType];

  // Apply filters
  const filteredOrders = useMemo(() => {
    return currentTypeOrders.filter(order => {
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
  }, [currentTypeOrders, searchQuery, statusFilter, dateRange]);

  // Stats
  const stats = useMemo(() => ({
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === "pending").length,
    in_progress: filteredOrders.filter(o => 
      o.status === "in_progress" || o.status === "processing"
    ).length,
    completed: filteredOrders.filter(o => o.status === "completed").length,
    cancelled: filteredOrders.filter(o => 
      o.status === "cancelled" || o.status === "refunded"
    ).length,
  }), [filteredOrders]);

  // Calculate spending (only completed orders count as actual spending)
  const totalSpent = useMemo(() => 
    filteredOrders
      .filter(o => o.status === 'completed' || o.status === 'in_progress' || o.status === 'processing')
      .reduce((sum, o) => sum + o.total_price, 0), 
    [filteredOrders]
  );

  // Today's spending
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

  // Counts for tabs
  const typeCounts = useMemo(() => ({
    all: orders.length,
    social: ordersByType.social.length,
    design: ordersByType.design.length,
    dev: ordersByType.dev.length,
  }), [orders, ordersByType]);

  // Get empty state based on type
  const getEmptyState = () => {
    switch (activeType) {
      case 'social':
        return { 
          title: "لا توجد طلبات مواقع تواصل", 
          description: "ابدأ بطلب خدمات التواصل الاجتماعي" 
        };
      case 'design':
        return { 
          title: "لا توجد طلبات تصميم", 
          description: "اطلب خدمات التصميم الآن" 
        };
      case 'dev':
        return { 
          title: "لا توجد طلبات برمجة", 
          description: "ابدأ مشروعك البرمجي معنا" 
        };
      default:
        return { 
          title: "لا توجد طلبات", 
          description: "ابدأ بإنشاء طلبك الأول" 
        };
    }
  };

  const emptyState = getEmptyState();

  return (
    <ClientDashboardLayout>
      <motion.div 
        className="space-y-5 pb-8 px-1" 
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Compact Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-accent/5 p-5 md:p-6 border border-border/50"
        >
          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div 
                className="relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </motion.div>
              
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">طلباتي</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  إدارة ومتابعة جميع طلباتك
                </p>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={() => navigate('/dashboard/our-services')} 
                className="gap-2 rounded-xl shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                طلب جديد
              </Button>
            </motion.div>
          </div>

          {/* Quick Type Icons */}
          <div className="relative mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
                <Share2 className="w-3.5 h-3.5 text-pink-500" />
                <span className="font-semibold text-pink-500">{typeCounts.social}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
                <Palette className="w-3.5 h-3.5 text-violet-500" />
                <span className="font-semibold text-violet-500">{typeCounts.design}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Code className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-500">{typeCounts.dev}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <OrdersTypeTabs 
            activeType={activeType} 
            onTypeChange={setActiveType}
            counts={typeCounts}
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <ModernOrdersStats stats={stats} totalSpent={totalSpent} todaySpent={todaySpent} />
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
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
            totalCount={currentTypeOrders.length}
          />
        </motion.div>

        {/* Orders Display - Different views for each type */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeType === 'social' || activeType === 'all' ? (
            <ModernOrdersTable
              orders={filteredOrders}
              loading={loading}
              onViewOrder={handleViewOrder}
              emptyTitle={emptyState.title}
              emptyDescription={emptyState.description}
            />
          ) : activeType === 'design' ? (
            <DesignOrdersList
              orders={filteredOrders}
              loading={loading}
              onViewOrder={handleViewOrder}
              emptyTitle={emptyState.title}
              emptyDescription={emptyState.description}
            />
          ) : (
            <DevOrdersList
              orders={filteredOrders}
              loading={loading}
              onViewOrder={handleViewOrder}
              emptyTitle={emptyState.title}
              emptyDescription={emptyState.description}
            />
          )}
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;
