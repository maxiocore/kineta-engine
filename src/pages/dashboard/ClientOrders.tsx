import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Search, Filter, Eye, Clock, CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
  notes: string | null;
  created_at: string;
  service: Service;
}

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

const ClientOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchServices();
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, notes, created_at,
        service:services(id, name, price, category)
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
      .select("id, name, price, category")
      .eq("status", "active");

    if (!error && data) {
      setServices(data);
    }
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
      order_number: `ORD-${Date.now()}` // Placeholder, will be replaced by trigger
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

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.service?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ClientDashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold mb-2"
            >
              الطلبات
            </motion.h1>
            <p className="text-muted-foreground">إدارة ومتابعة جميع طلباتك</p>
          </div>
          <Button onClick={() => setIsNewOrderOpen(true)} className="bg-gradient-primary hover:opacity-90">
            <ShoppingBag className="w-4 h-4 ms-2" />
            طلب جديد
          </Button>
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
                لا توجد طلبات حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-4 px-4 font-medium text-muted-foreground">رقم الطلب</th>
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
                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
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
                        {service.name} - {service.price.toLocaleString()} ر.س
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

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">تفاصيل الطلب</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الطلب</p>
                    <p className="font-medium">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusConfig(selectedOrder.status).color}`}>
                      {getStatusConfig(selectedOrder.status).label}
                    </span>
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
                    <p className="text-sm text-muted-foreground">ملاحظاتك</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;
