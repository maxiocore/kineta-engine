import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FileText
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
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

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
    case "pending": return { label: "قيد الانتظار", color: "bg-warning/10 text-warning border-warning/20", icon: Clock, progress: 10 };
    case "confirmed": return { label: "مؤكد", color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle, progress: 30 };
    case "in_progress": return { label: "قيد التنفيذ", color: "bg-accent/10 text-accent border-accent/20", icon: Loader2, progress: 60 };
    case "completed": return { label: "مكتمل", color: "bg-success/10 text-success border-success/20", icon: CheckCircle, progress: 100 };
    case "cancelled": return { label: "ملغي", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, progress: 0 };
    case "refunded": return { label: "مسترد", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle, progress: 0 };
    default: return { label: status, color: "bg-muted text-muted-foreground border-border", icon: Clock, progress: 0 };
  }
};

const ClientOrders = () => {
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

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchServices();

      // Real-time subscription for order updates
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
            console.log('Order update received:', payload);
            if (payload.eventType === 'UPDATE') {
              // Update the order in state immediately
              setOrders(prev => prev.map(order => {
                if (order.id === payload.new.id) {
                  return { ...order, ...payload.new };
                }
                return order;
              }));
              
              // Update selected order if it's the one being viewed
              if (selectedOrder && selectedOrder.id === payload.new.id) {
                setSelectedOrder(prev => prev ? { ...prev, ...payload.new } : null);
                // Refresh history
                fetchOrderHistory(payload.new.id as string);
              }
              
              // Show notification
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
    in_progress: orders.filter(o => o.status === "in_progress").length,
    completed: orders.filter(o => o.status === "completed").length,
  };

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl sm:text-3xl font-bold mb-2"
            >
              طلباتي
            </motion.h1>
            <p className="text-muted-foreground">إدارة ومتابعة جميع طلباتك في الوقت الفعلي</p>
          </div>
          <Button onClick={() => setIsNewOrderOpen(true)} className="bg-gradient-primary hover:opacity-90">
            <ShoppingBag className="w-4 h-4 ms-2" />
            طلب جديد
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الطلبات", value: stats.total, icon: ShoppingBag, gradient: "from-primary to-cyan-400" },
            { label: "قيد الانتظار", value: stats.pending, icon: Clock, gradient: "from-warning to-orange-400" },
            { label: "قيد التنفيذ", value: stats.in_progress, icon: Loader2, gradient: "from-accent to-pink-400" },
            { label: "مكتملة", value: stats.completed, icon: CheckCircle, gradient: "from-success to-emerald-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="البحث في الطلبات..." 
                  className="pr-10 bg-secondary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="فلترة الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              قائمة الطلبات
              <Badge variant="secondary" className="mr-2">{filteredOrders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد طلبات حتى الآن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">رقم الطلب</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الخدمة</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الكمية</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">التاريخ</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">السعر</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredOrders.map((order, index) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <code className="px-2 py-1 bg-secondary rounded text-sm font-mono">
                                {order.order_number}
                              </code>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium text-sm">{order.service?.name}</p>
                                <p className="text-xs text-muted-foreground">{order.service?.category}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-medium">{order.quantity?.toLocaleString() || "-"}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                <statusConfig.icon className={`w-3 h-3 ${order.status === "in_progress" ? "animate-spin" : ""}`} />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground text-sm">
                              {format(new Date(order.created_at), "d MMMM yyyy", { locale: ar })}
                            </td>
                            <td className="py-4 px-4 font-bold text-primary">
                              ${order.total_price.toFixed(2)}
                            </td>
                            <td className="py-4 px-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewOrder(order)}
                                className="gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                التفاصيل
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Order Dialog */}
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">طلب جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اختر الخدمة</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
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
              <Button onClick={handleCreateOrder} disabled={submitting} className="w-full bg-gradient-primary">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "إرسال الطلب"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                تفاصيل الطلب
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">التفاصيل</TabsTrigger>
                  <TabsTrigger value="history">سجل التحديثات</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-4">
                  {/* Status & Progress */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">حالة الطلب</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusConfig(selectedOrder.status).color}`}>
                        {React.createElement(getStatusConfig(selectedOrder.status).icon, { 
                          className: `w-4 h-4 ${selectedOrder.status === "in_progress" ? "animate-spin" : ""}` 
                        })}
                        {getStatusConfig(selectedOrder.status).label}
                      </span>
                    </div>
                    <Progress value={getStatusConfig(selectedOrder.status).progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {getStatusConfig(selectedOrder.status).progress}% مكتمل
                    </p>
                  </div>

                  {/* Order Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">رقم الطلب</span>
                      </div>
                      <code className="font-mono font-bold">{selectedOrder.order_number}</code>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">تاريخ الطلب</span>
                      </div>
                      <p className="font-medium">
                        {format(new Date(selectedOrder.created_at), "d MMMM yyyy - HH:mm", { locale: ar })}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">الخدمة</span>
                      </div>
                      <p className="font-medium">{selectedOrder.service?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedOrder.service?.category}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">الكمية</span>
                      </div>
                      <p className="font-bold text-lg">{selectedOrder.quantity?.toLocaleString() || "-"}</p>
                    </div>
                  </div>

                  {/* Link */}
                  {selectedOrder.link && (
                    <div className="p-4 rounded-xl bg-card border border-border/50">
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
                    </div>
                  )}

                  {/* Service Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
                      <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-xs text-muted-foreground mb-1">وقت التسليم</p>
                      <p className="font-bold">فوري - 24 ساعة</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 text-center">
                      <Shield className="w-6 h-6 mx-auto mb-2 text-success" />
                      <p className="text-xs text-muted-foreground mb-1">ضمان</p>
                      <p className="font-bold">30 يوم</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 text-center sm:col-span-1 col-span-2">
                      <Timer className="w-6 h-6 mx-auto mb-2 text-accent" />
                      <p className="text-xs text-muted-foreground mb-1">آخر تحديث</p>
                      <p className="font-bold text-sm">
                        {formatDistanceToNow(new Date(selectedOrder.updated_at), { locale: ar, addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* External Order Info */}
                  {selectedOrder.external_order_id && (
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <ExternalLink className="w-4 h-4 text-primary" />
                        <span className="font-medium">معلومات المزود</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">رقم الطلب الخارجي</p>
                          <code className="font-mono">{selectedOrder.external_order_id}</code>
                        </div>
                        <div>
                          <p className="text-muted-foreground">الحالة الخارجية</p>
                          <Badge variant="outline">{selectedOrder.external_status || "غير متوفر"}</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
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
                  </div>

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

                <TabsContent value="history" className="mt-4">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>لا يوجد سجل تحديثات بعد</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderHistory.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-primary" : "bg-muted"}`} />
                            {index < orderHistory.length - 1 && (
                              <div className="w-px h-full bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusConfig(item.new_status).color}`}>
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
                              <p className="text-sm mt-1 text-muted-foreground">{item.notes}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;
