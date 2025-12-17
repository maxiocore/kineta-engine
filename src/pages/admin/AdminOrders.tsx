import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Search, Filter, Eye, CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
}

const statusOptions = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "confirmed", label: "مؤكد" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
  { value: "refunded", label: "مسترد" },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "قيد الانتظار", color: "bg-warning/10 text-warning", icon: Clock };
    case "confirmed": return { label: "مؤكد", color: "bg-primary/10 text-primary", icon: CheckCircle };
    case "in_progress": return { label: "قيد التنفيذ", color: "bg-accent/10 text-accent", icon: Loader2 };
    case "completed": return { label: "مكتمل", color: "bg-success/10 text-success", icon: CheckCircle };
    case "cancelled": return { label: "ملغي", color: "bg-destructive/10 text-destructive", icon: XCircle };
    case "refunded": return { label: "مسترد", color: "bg-muted text-muted-foreground", icon: AlertCircle };
    default: return { label: status, color: "bg-muted text-muted-foreground", icon: Clock };
  }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<OrderStats>({ pending: 0, in_progress: 0, completed: 0, total: 0 });

  useEffect(() => {
    fetchOrders();

    // Realtime subscription
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
      
      // Calculate stats
      setStats({
        pending: ordersData.filter(o => o.status === "pending").length,
        in_progress: ordersData.filter(o => o.status === "in_progress").length,
        completed: ordersData.filter(o => o.status === "completed").length,
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

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.service?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold mb-2"
            >
              إدارة الطلبات
            </motion.h1>
            <p className="text-muted-foreground">متابعة وإدارة جميع الطلبات</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: "طلبات جديدة", value: stats.pending, color: "from-warning to-orange-400" },
            { label: "قيد التنفيذ", value: stats.in_progress, color: "from-accent to-pink-400" },
            { label: "مكتملة", value: stats.completed, color: "from-success to-emerald-400" },
            { label: "إجمالي الطلبات", value: stats.total, color: "from-primary to-cyan-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} p-2 mb-3`}>
                    <ShoppingBag className="w-full h-full text-primary-foreground" />
                  </div>
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

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
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                تصفية
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display">قائمة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد طلبات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">رقم الطلب</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">العميل</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الخدمة</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">التاريخ</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">السعر</th>
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => {
                      const statusConfig = getStatusConfig(order.status);
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-4 px-4 font-medium">{order.order_number}</td>
                          <td className="py-4 px-4">{order.profile?.full_name || order.profile?.email || "غير معروف"}</td>
                          <td className="py-4 px-4">{order.service?.name}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <statusConfig.icon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {format(new Date(order.created_at), "d MMMM yyyy", { locale: ar })}
                          </td>
                          <td className="py-4 px-4 font-medium">{order.total_price.toLocaleString()} ر.س</td>
                          <td className="py-4 px-4">
                            <Button variant="ghost" size="icon" onClick={() => openOrderDetails(order)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">تفاصيل الطلب</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الطلب</p>
                    <p className="font-medium">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">العميل</p>
                    <p className="font-medium">{selectedOrder.profile?.full_name || selectedOrder.profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الخدمة</p>
                    <p className="font-medium">{selectedOrder.service?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">السعر</p>
                    <p className="font-medium">{selectedOrder.total_price.toLocaleString()} ر.س</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ملاحظات العميل</p>
                    <p className="text-sm bg-secondary/50 p-3 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>تحديث الحالة</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات الإدارة</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="أضف ملاحظات داخلية..."
                  />
                </div>

                <Button onClick={handleUpdateOrder} disabled={updating} className="w-full bg-gradient-primary">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التغييرات"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminOrders;
