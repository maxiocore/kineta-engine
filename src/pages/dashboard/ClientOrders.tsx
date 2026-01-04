import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Plus, 
  ArrowRight, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Calendar,
  ChevronLeft,
  Palette,
  Code,
  TrendingUp,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
  quantity: number | null;
  service: Service;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  pending: { label: 'قيد الانتظار', color: 'text-amber-500', icon: Clock, bg: 'bg-amber-500/10' },
  in_progress: { label: 'قيد التنفيذ', color: 'text-blue-500', icon: Loader2, bg: 'bg-blue-500/10' },
  processing: { label: 'قيد المعالجة', color: 'text-blue-500', icon: Loader2, bg: 'bg-blue-500/10' },
  completed: { label: 'مكتمل', color: 'text-emerald-500', icon: CheckCircle2, bg: 'bg-emerald-500/10' },
  cancelled: { label: 'ملغي', color: 'text-red-500', icon: XCircle, bg: 'bg-red-500/10' },
  refunded: { label: 'مسترد', color: 'text-orange-500', icon: XCircle, bg: 'bg-orange-500/10' },
};

// Order Card Component
const OrderCard = ({ 
  order, 
  onView 
}: { 
  order: Order; 
  onView: (order: Order) => void;
}) => {
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  // Determine order type by category
  const getOrderType = (category: string) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('design') || lower.includes('تصميم')) return { icon: Palette, gradient: 'from-rose-500 to-violet-500' };
    if (lower.includes('dev') || lower.includes('برمجة')) return { icon: Code, gradient: 'from-emerald-500 to-cyan-500' };
    return { icon: Package, gradient: 'from-primary to-accent' };
  };
  
  const orderType = getOrderType(order.service?.category);
  const TypeIcon = orderType.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Card className="overflow-hidden border-2 border-border/50 bg-card/90 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 rounded-xl">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0",
              orderType.gradient
            )}>
              <TypeIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                    {order.service?.name || 'خدمة غير محددة'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    #{order.order_number}
                  </p>
                </div>
                
                {/* Status Badge */}
                <Badge className={cn("shrink-0 gap-1 text-xs", status.bg, status.color)}>
                  <StatusIcon className={cn("w-3 h-3", order.status === 'in_progress' && "animate-spin")} />
                  {status.label}
                </Badge>
              </div>

              {/* Info Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ar })}
                </span>
                {order.quantity && (
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {order.quantity} وحدة
                  </span>
                )}
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {order.total_price.toFixed(2)} ر.س
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-8 rounded-lg hover:bg-primary/10"
                  onClick={() => onView(order)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  التفاصيل
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ClientOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => 
              order.id === payload.new.id ? { ...order, ...payload.new } : order
            ));
            toast.info("تم تحديث حالة طلبك");
          } else if (payload.eventType === 'INSERT') {
            fetchOrders();
          }
        })
        .subscribe();
        
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, created_at, quantity,
        service:services(id, name, price, category)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    
    if (error) toast.error("خطأ في جلب الطلبات");
    else setOrders(data as unknown as Order[]);
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
    a.download = 'orders.csv';
    a.click();
    toast.success("تم تصدير الطلبات");
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    in_progress: orders.filter(o => o.status === "in_progress" || o.status === "processing").length,
    completed: orders.filter(o => o.status === "completed").length,
  }), [orders]);

  return (
    <ClientDashboardLayout>
      <motion.div 
        className="space-y-6 pb-8" 
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-5 sm:p-6 border border-primary/20"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <ShoppingBag className="w-7 h-7 text-white" />
              </motion.div>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">سجل طلباتي</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {orders.length} طلب إجمالي
                </p>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/dashboard/our-services')} 
              className="gap-2 rounded-xl shadow-lg"
            >
              <Plus className="w-4 h-4" />
              طلب جديد
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: 'إجمالي', value: stats.total, color: 'text-foreground', bg: 'bg-secondary' },
            { label: 'قيد الانتظار', value: stats.pending, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'قيد التنفيذ', value: stats.in_progress, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'مكتمل', value: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={cn("p-4 rounded-xl text-center", stat.bg)}
            >
              <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الطلب أو اسم الخدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 rounded-xl"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="حالة الطلب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>عرض {filteredOrders.length} من {orders.length} طلب</span>
        </div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== 'all' ? 'لا توجد نتائج' : 'لا توجد طلبات بعد'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'all' 
                  ? 'جرب تغيير معايير البحث' 
                  : 'ابدأ بإنشاء طلبك الأول الآن'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => navigate('/dashboard/our-services')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  طلب جديد
                </Button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={handleViewOrder}
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;
