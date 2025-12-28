import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, Plus, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

import { 
  OrderType, 
  ModernOrdersStats, 
  ModernOrdersSearch,
  ModernOrdersTable,
  DesignOrdersList,
  DevOrdersList,
  OrdersSectionCards,
  SectionHeader
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

// Define category mappings for order types
const socialCategories = [
  'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 
  'telegram', 'linkedin', 'pinterest', 'social', 'smm', 'followers',
  'likes', 'views', 'comments', 'shares', 'subscribers'
];

const marketingCategories = [
  'marketing', 'digital', 'seo', 'sem', 'ppc', 'ads', 'advertising',
  'google ads', 'facebook ads', 'campaign', 'email marketing', 'content',
  'analytics', 'conversion', 'lead', 'funnel', 'automation', 'تسويق'
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
  
  if (marketingCategories.some(c => lowerCategory.includes(c))) return 'marketing';
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
  const [activeSection, setActiveSection] = useState<OrderType | null>(null);

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
        external_status, discount_amount, start_count, remains,
        service:services(id, name, price, category, description, features)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    
    if (error) toast.error("خطأ في جلب الطلبات");
    else setOrders(data as unknown as Order[]);
    setLoading(false);
  };

  const handleViewOrder = async (order: Order) => {
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
    const result = { 
      all: orders, 
      social: [] as Order[], 
      marketing: [] as Order[],
      design: [] as Order[], 
      dev: [] as Order[] 
    };
    
    orders.forEach(order => {
      const type = getOrderType(order.service?.category);
      result[type].push(order);
    });
    
    return result;
  }, [orders]);

  // Get current section orders
  const currentSectionOrders = activeSection ? ordersByType[activeSection] : [];

  // Apply filters
  const filteredOrders = useMemo(() => {
    return currentSectionOrders.filter(order => {
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
  }, [currentSectionOrders, searchQuery, statusFilter, dateRange]);

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

  // Calculate spending
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

  // Counts for section cards
  const typeCounts = useMemo(() => ({
    all: orders.length,
    social: ordersByType.social.length,
    marketing: ordersByType.marketing.length,
    design: ordersByType.design.length,
    dev: ordersByType.dev.length,
  }), [orders, ordersByType]);

  // Get empty state based on section
  const getEmptyState = () => {
    switch (activeSection) {
      case 'social':
        return { 
          title: "لا توجد طلبات مواقع تواصل", 
          description: "ابدأ بطلب خدمات التواصل الاجتماعي" 
        };
      case 'marketing':
        return { 
          title: "لا توجد طلبات تسويق رقمي", 
          description: "ابدأ حملتك التسويقية الآن" 
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
        className="space-y-6 pb-8" 
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Main Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 border border-primary/20"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/2 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
              </motion.div>
              
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">سجل طلباتي</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  اختر القسم لعرض سجل الطلبات الخاص به
                </p>
              </div>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => navigate('/dashboard/our-services')} 
                className="gap-2 rounded-xl text-base px-5 py-2.5 h-auto shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                <span>طلب جديد</span>
              </Button>
            </motion.div>
          </div>

          {/* Total Orders Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mt-6 flex items-center gap-3 text-sm text-muted-foreground"
          >
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold">
              {orders.length} طلب إجمالي
            </span>
            <span>•</span>
            <span>تصفح الأقسام أدناه لعرض تفاصيل الطلبات</span>
          </motion.div>
        </motion.div>

        {/* Animated Content Area */}
        <AnimatePresence mode="wait">
          {!activeSection ? (
            /* Section Cards View */
            <motion.div
              key="section-cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Instructions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 rounded-xl bg-muted/50 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">اختر قسم لعرض سجل الطلبات</h3>
                    <p className="text-sm text-muted-foreground">
                      انقر على أي قسم لعرض جميع الطلبات المتعلقة به وتتبع حالتها
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Section Cards */}
              <OrdersSectionCards
                activeSection={null}
                onSectionClick={(section) => setActiveSection(section)}
                counts={typeCounts}
              />
            </motion.div>
          ) : (
            /* Section Orders View */
            <motion.div
              key={`section-${activeSection}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Section Header */}
              <SectionHeader
                section={activeSection}
                count={typeCounts[activeSection]}
                onBack={() => setActiveSection(null)}
              />

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ModernOrdersStats stats={stats} totalSpent={totalSpent} todaySpent={todaySpent} />
              </motion.div>

              {/* Search & Filters */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
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
                  totalCount={currentSectionOrders.length}
                />
              </motion.div>

              {/* Orders Display */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {activeSection === 'design' ? (
                  <DesignOrdersList
                    orders={filteredOrders}
                    loading={loading}
                    onViewOrder={handleViewOrder}
                    emptyTitle={emptyState.title}
                    emptyDescription={emptyState.description}
                  />
                ) : activeSection === 'dev' ? (
                  <DevOrdersList
                    orders={filteredOrders}
                    loading={loading}
                    onViewOrder={handleViewOrder}
                    emptyTitle={emptyState.title}
                    emptyDescription={emptyState.description}
                  />
                ) : (
                  <ModernOrdersTable
                    orders={filteredOrders}
                    loading={loading}
                    onViewOrder={handleViewOrder}
                    emptyTitle={emptyState.title}
                    emptyDescription={emptyState.description}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;
