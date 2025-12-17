import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
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
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  user_id: string;
  service: { id: string; name: string; category: string };
  profile: { full_name: string | null; email: string | null };
}

interface OrderStats {
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
  cancelled: number;
}

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", icon: Clock, color: "warning" },
  { value: "confirmed", label: "مؤكد", icon: CheckCircle, color: "primary" },
  { value: "in_progress", label: "قيد التنفيذ", icon: Loader2, color: "accent" },
  { value: "completed", label: "مكتمل", icon: CheckCircle, color: "success" },
  { value: "cancelled", label: "ملغي", icon: XCircle, color: "destructive" },
  { value: "refunded", label: "مسترد", icon: AlertCircle, color: "muted" },
];

const getStatusConfig = (status: string) => {
  const config = statusOptions.find(s => s.value === status);
  if (!config) return { label: status, color: "muted", icon: Clock };
  
  const colorMap: Record<string, string> = {
    warning: "bg-warning/10 text-warning border-warning/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    success: "bg-success/10 text-success border-success/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-muted",
  };
  
  return { 
    label: config.label, 
    color: colorMap[config.color] || colorMap.muted, 
    icon: config.icon 
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<OrderStats>({ pending: 0, in_progress: 0, completed: 0, total: 0, cancelled: 0 });

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, notes, admin_notes, created_at, user_id,
        service:services(id, name, category),
        profile:profiles(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب الطلبات");
    } else {
      const ordersData = data as unknown as Order[];
      setOrders(ordersData);
      
      setStats({
        pending: ordersData.filter(o => o.status === "pending").length,
        in_progress: ordersData.filter(o => o.status === "in_progress").length,
        completed: ordersData.filter(o => o.status === "completed").length,
        cancelled: ordersData.filter(o => o.status === "cancelled").length,
        total: ordersData.length
      });
    }
    setLoading(false);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({
        status: (newStatus || selectedOrder.status) as "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "refunded",
        admin_notes: adminNotes || selectedOrder.admin_notes
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

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.admin_notes || "");
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.service?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statsData = [
    { label: "طلبات جديدة", value: stats.pending, icon: Clock, gradient: "from-warning to-orange-400", shadowColor: "shadow-warning/20" },
    { label: "قيد التنفيذ", value: stats.in_progress, icon: Loader2, gradient: "from-accent to-pink-400", shadowColor: "shadow-accent/20" },
    { label: "مكتملة", value: stats.completed, icon: CheckCircle, gradient: "from-success to-emerald-400", shadowColor: "shadow-success/20" },
    { label: "إجمالي الطلبات", value: stats.total, icon: ShoppingBag, gradient: "from-primary to-cyan-400", shadowColor: "shadow-primary/20" },
  ];

  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <ShoppingBag className="w-8 h-8 text-primary" />
              </motion.div>
              إدارة الطلبات
            </h1>
            <p className="text-muted-foreground">متابعة وإدارة جميع الطلبات</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className={`card-elevated border-border/30 ${stat.shadowColor} shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </motion.div>
                    <div>
                      <motion.p 
                        className="text-2xl font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="البحث في الطلبات..." 
                    className="pr-10 bg-secondary/50 border-border/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 bg-secondary/50 border-border/50">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="فلترة الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders List */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                قائمة الطلبات
                <Badge variant="secondary" className="mr-2">{filteredOrders.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-lg">لا توجد طلبات</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredOrders.map((order, index) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ x: -4 }}
                          className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/30 hover:border-primary/20 transition-all cursor-pointer group"
                          onClick={() => openOrderDetails(order)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <motion.div 
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20"
                                whileHover={{ scale: 1.1 }}
                              >
                                <ShoppingBag className="w-6 h-6 text-primary" />
                              </motion.div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold">{order.order_number}</span>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig.label}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <User className="w-3.5 h-3.5" />
                                  {order.profile?.full_name || order.profile?.email || "غير معروف"}
                                  <span className="text-border">•</span>
                                  <Package className="w-3.5 h-3.5" />
                                  {order.service?.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-left">
                                <p className="font-bold text-success">{order.total_price.toLocaleString()} ر.س</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(order.created_at), "d MMM yyyy", { locale: ar })}
                                </p>
                              </div>
                              <motion.div
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                whileHover={{ scale: 1.1 }}
                              >
                                <Button variant="ghost" size="icon" className="rounded-full">
                                  <ArrowLeft className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                تفاصيل الطلب
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Order Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">رقم الطلب</p>
                    <p className="font-bold">{selectedOrder.order_number}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">العميل</p>
                    <p className="font-bold truncate">{selectedOrder.profile?.full_name || selectedOrder.profile?.email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">الخدمة</p>
                    <p className="font-bold">{selectedOrder.service?.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">السعر</p>
                    <p className="font-bold text-success">{selectedOrder.total_price.toLocaleString()} ر.س</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-2">ملاحظات العميل</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium">تحديث الحالة</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">ملاحظات الإدارة</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظات داخلية..."
                    className="bg-secondary/50 min-h-24 resize-none"
                  />
                </div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button 
                    onClick={handleUpdateOrder} 
                    disabled={updating} 
                    className="w-full bg-gradient-to-l from-primary to-cyan-500 text-primary-foreground shadow-lg shadow-primary/20"
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
                </motion.div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminOrders;
