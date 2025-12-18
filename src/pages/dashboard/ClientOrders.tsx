import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2,
  Link as LinkIcon,
  Hash,
  Calendar,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Shield,
  Timer,
  FileText,
  Sparkles,
  TrendingUp,
  Package,
  ArrowUpLeft,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "قيد الانتظار", color: "bg-warning/10 text-warning border-warning/20", iconBg: "bg-warning", icon: Clock, progress: 10 };
    case "processing": return { label: "قيد المعالجة", color: "bg-primary/10 text-primary border-primary/20", iconBg: "bg-primary", icon: Loader2, progress: 30 };
    case "in_progress": return { label: "قيد التنفيذ", color: "bg-accent/10 text-accent border-accent/20", iconBg: "bg-accent", icon: Loader2, progress: 60 };
    case "completed": return { label: "مكتمل", color: "bg-success/10 text-success border-success/20", iconBg: "bg-success", icon: CheckCircle, progress: 100 };
    case "partial": return { label: "مكتمل جزئي", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", iconBg: "bg-orange-500", icon: AlertCircle, progress: 80 };
    case "cancelled": return { label: "ملغي", color: "bg-destructive/10 text-destructive border-destructive/20", iconBg: "bg-destructive", icon: XCircle, progress: 0 };
    default: return { label: status, color: "bg-muted text-muted-foreground border-border", iconBg: "bg-muted", icon: Clock, progress: 0 };
  }
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

const ClientOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchServices();

      const channel = supabase
        .channel('client-orders-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(order => {
                if (order.id === payload.new.id) {
                  return { ...order, ...payload.new };
                }
                return order;
              }));
              
              if (selectedOrder && selectedOrder.id === payload.new.id) {
                setSelectedOrder(prev => prev ? { ...prev, ...payload.new } : null);
                fetchOrderHistory(payload.new.id as string);
              }
              
              const newStatus = getStatusConfig(payload.new.status as string);
              toast.info(`تم تحديث حالة طلبك إلى: ${newStatus.label}`, {
                duration: 5000,
              });
            } else if (payload.eventType === 'INSERT') {
              fetchOrders();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, selectedOrder]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, notes, admin_notes, created_at, updated_at,
        link, quantity, external_order_id, external_status, discount_amount,
        service:services(id, name, price, category, description, features)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب الطلبات");
    } else {
      setOrders(data as unknown as Order[]);
    }
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, category, description, features")
      .eq("status", "active");

    if (!error && data) {
      setServices(data);
    }
  };

  const fetchOrderHistory = async (orderId: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrderHistory(data);
    }
    setLoadingHistory(false);
  };

  const handleCreateOrder = async () => {
    if (!selectedServiceId) {
      toast.error("يرجى اختيار خدمة");
      return;
    }

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user?.id as string,
      service_id: selectedServiceId,
      total_price: service.price,
      notes: orderNotes || null,
      order_number: `ORD-${Date.now()}`
    } as any);

    if (error) {
      toast.error("خطأ في إنشاء الطلب");
    } else {
      toast.success("تم إنشاء الطلب بنجاح");
      setIsNewOrderOpen(false);
      setSelectedServiceId("");
      setOrderNotes("");
      fetchOrders();
    }
    setSubmitting(false);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("تم نسخ الرابط");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.service?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      <motion.div 
        className="space-y-6 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/20 via-primary/10 to-accent/20 p-6 md:p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
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
              <Button 
                onClick={() => navigate('/dashboard/services')} 
                className="h-12 px-6 gap-3 btn-brand rounded-xl"
              >
                <ShoppingBag className="w-5 h-5" />
                طلب جديد
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "إجمالي الطلبات", value: stats.total, icon: Package, gradient: "from-primary to-cyan-400", bg: "bg-primary/10" },
            { label: "قيد الانتظار", value: stats.pending, icon: Clock, gradient: "from-warning to-orange-400", bg: "bg-warning/10" },
            { label: "قيد التنفيذ", value: stats.in_progress, icon: Loader2, gradient: "from-accent to-pink-400", bg: "bg-accent/10", spin: true },
            { label: "مكتملة", value: stats.completed, icon: CheckCircle, gradient: "from-success to-emerald-400", bg: "bg-success/10" },
            { label: "إجمالي الإنفاق", value: `$${totalSpent.toFixed(2)}`, icon: TrendingUp, gradient: "from-purple-500 to-violet-400", bg: "bg-purple-500/10", isPrice: true },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "lg:col-span-1",
                index === 4 && "col-span-2 lg:col-span-1"
              )}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 relative">
                  <div className={`absolute top-0 left-0 w-20 h-20 ${stat.bg} rounded-full blur-2xl group-hover:w-24 group-hover:h-24 transition-all`} />
                  <div className="relative flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg shrink-0`}>
                      <stat.icon className={cn("w-full h-full text-white", stat.spin && "animate-spin")} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("font-bold", stat.isPrice ? "text-xl" : "text-2xl")}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="البحث في الطلبات..." 
                    className="h-12 pr-12 bg-muted/30 border-border/50 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl bg-muted/30 border-border/50">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="فلترة الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الطلبات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="partial">مكتمل جزئي</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className="h-12 w-12 rounded-xl border-border/50"
                  >
                    <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">لا توجد طلبات</p>
                  <p className="text-sm text-muted-foreground/70 mb-4">ابدأ بإنشاء طلبك الأول</p>
                  <Button onClick={() => navigate('/dashboard/services')} className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    طلب جديد
                  </Button>
                </motion.div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="divide-y divide-border/50">
                    <AnimatePresence>
                      {filteredOrders.map((order, index) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                            className="p-4 cursor-pointer transition-colors"
                            onClick={() => handleViewOrder(order)}
                          >
                            <div className="flex items-center gap-4">
                              {/* Status Icon */}
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                statusConfig.iconBg
                              )}>
                                <statusConfig.icon className={cn(
                                  "w-6 h-6 text-white",
                                  (order.status === "in_progress" || order.status === "processing") && "animate-spin"
                                )} />
                              </div>

                              {/* Order Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="px-2 py-0.5 bg-secondary rounded text-xs font-mono">
                                    {order.order_number}
                                  </code>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                    statusConfig.color
                                  )}>
                                    {statusConfig.label}
                                  </span>
                                </div>
                                <p className="font-medium text-sm line-clamp-1">{order.service?.name}</p>
                                <p className="text-xs text-muted-foreground">{order.service?.category}</p>
                              </div>

                              {/* Quantity & Price */}
                              <div className="text-left shrink-0 hidden sm:block">
                                <p className="text-sm text-muted-foreground">الكمية</p>
                                <p className="font-bold">{order.quantity?.toLocaleString() || "-"}</p>
                              </div>

                              <div className="text-left shrink-0">
                                <p className="text-sm text-muted-foreground hidden sm:block">السعر</p>
                                <p className="font-bold text-primary text-lg">${order.total_price.toFixed(2)}</p>
                              </div>

                              {/* Date */}
                              <div className="text-left shrink-0 hidden md:block">
                                <p className="text-sm text-muted-foreground">التاريخ</p>
                                <p className="text-sm">{format(new Date(order.created_at), "d MMM yyyy", { locale: ar })}</p>
                              </div>

                              {/* Action */}
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                  <ChevronLeft className="w-5 h-5" />
                                </Button>
                              </motion.div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3">
                              <Progress value={statusConfig.progress} className="h-1" />
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

        {/* New Order Dialog */}
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                طلب جديد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اختر الخدمة</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="اختر خدمة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateOrder} 
                disabled={submitting} 
                className="w-full h-12 gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                إرسال الطلب
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                تفاصيل الطلب
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <Tabs defaultValue="details" className="flex flex-col flex-1">
                <div className="px-6">
                  <TabsList className="w-full grid grid-cols-2 h-12 bg-muted/30 rounded-xl p-1">
                    <TabsTrigger value="details" className="gap-2 rounded-lg">
                      <FileText className="w-4 h-4" />
                      التفاصيل
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      سجل التحديثات
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 max-h-[60vh]">
                  <TabsContent value="details" className="p-6 pt-4 space-y-4 m-0">
                    {/* Status Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">حالة الطلب</span>
                        <span className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
                          getStatusConfig(selectedOrder.status).color
                        )}>
                          {React.createElement(getStatusConfig(selectedOrder.status).icon, { 
                            className: cn("w-4 h-4", selectedOrder.status === "in_progress" && "animate-spin")
                          })}
                          {getStatusConfig(selectedOrder.status).label}
                        </span>
                      </div>
                      <Progress value={getStatusConfig(selectedOrder.status).progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {getStatusConfig(selectedOrder.status).progress}% مكتمل
                      </p>
                    </motion.div>

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Hash, label: "رقم الطلب", value: selectedOrder.order_number, mono: true },
                        { icon: Calendar, label: "تاريخ الطلب", value: format(new Date(selectedOrder.created_at), "d MMMM yyyy", { locale: ar }) },
                        { icon: ShoppingBag, label: "الخدمة", value: selectedOrder.service?.name, sub: selectedOrder.service?.category },
                        { icon: Hash, label: "الكمية", value: selectedOrder.quantity?.toLocaleString() || "-" },
                      ].map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-4 rounded-xl bg-card border border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <item.icon className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                          </div>
                          <p className={cn("font-medium", item.mono && "font-mono")}>{item.value}</p>
                          {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
                        </motion.div>
                      ))}
                    </div>

                    {/* Link */}
                    {selectedOrder.link && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-xl bg-card border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">الرابط</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(selectedOrder.link!)}
                            >
                              {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a href={selectedOrder.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                        <p className="font-mono text-sm break-all bg-secondary/50 p-2 rounded" dir="ltr">
                          {selectedOrder.link}
                        </p>
                      </motion.div>
                    )}

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Zap, label: "وقت التسليم", value: "فوري - 24 ساعة", gradient: "from-primary/10 to-primary/5", border: "border-primary/20", iconColor: "text-primary" },
                        { icon: Shield, label: "ضمان", value: "30 يوم", gradient: "from-success/10 to-success/5", border: "border-success/20", iconColor: "text-success" },
                        { icon: Timer, label: "آخر تحديث", value: formatDistanceToNow(new Date(selectedOrder.updated_at), { locale: ar, addSuffix: true }), gradient: "from-accent/10 to-accent/5", border: "border-accent/20", iconColor: "text-accent" },
                      ].map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          className={cn(
                            "p-3 rounded-xl text-center border",
                            `bg-gradient-to-br ${item.gradient} ${item.border}`
                          )}
                        >
                          <item.icon className={cn("w-5 h-5 mx-auto mb-2", item.iconColor)} />
                          <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                          <p className="font-bold text-xs">{item.value}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Price Summary */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-xl bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">السعر الأساسي:</span>
                          <span>${(selectedOrder.total_price + (selectedOrder.discount_amount || 0)).toFixed(2)}</span>
                        </div>
                        {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                          <div className="flex justify-between items-center text-sm text-success">
                            <span>الخصم:</span>
                            <span>-${selectedOrder.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">الإجمالي:</span>
                          <span className="text-2xl font-bold text-primary">${selectedOrder.total_price.toFixed(2)}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Notes */}
                    {selectedOrder.notes && (
                      <div className="p-4 rounded-xl bg-card border border-border/50">
                        <p className="text-sm text-muted-foreground mb-2">ملاحظاتك:</p>
                        <p className="text-sm">{selectedOrder.notes}</p>
                      </div>
                    )}
                    {selectedOrder.admin_notes && (
                      <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                        <p className="text-sm text-muted-foreground mb-2">ملاحظات الإدارة:</p>
                        <p className="text-sm">{selectedOrder.admin_notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="p-6 pt-4 m-0">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : orderHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                          <Clock className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground">لا يوجد سجل تحديثات بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orderHistory.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-4 h-4 rounded-full",
                                index === 0 ? "bg-primary" : "bg-muted"
                              )} />
                              {index < orderHistory.length - 1 && (
                                <div className="w-px flex-1 bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-xs font-medium",
                                  getStatusConfig(item.new_status).color
                                )}>
                                  {getStatusConfig(item.new_status).label}
                                </span>
                                {item.old_status && (
                                  <span className="text-xs text-muted-foreground">
                                    من {getStatusConfig(item.old_status).label}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(item.created_at), "d MMMM yyyy - HH:mm", { locale: ar })}
                              </p>
                              {item.notes && (
                                <p className="text-sm mt-2 text-muted-foreground bg-muted/50 p-2 rounded">{item.notes}</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;
