import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  TrendingUp,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  Package,
  Filter,
  Calendar,
  BarChart3,
  Target,
  RefreshCw,
  Megaphone,
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  quantity: number;
  link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  service: {
    id: string;
    name: string;
    category: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  processing: { label: "جاري التنفيذ", color: "bg-blue-500/20 text-blue-500", icon: Loader2 },
  completed: { label: "مكتمل", color: "bg-green-500/20 text-green-500", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "bg-red-500/20 text-red-500", icon: XCircle },
  partial: { label: "مكتمل جزئياً", color: "bg-orange-500/20 text-orange-500", icon: AlertCircle },
  in_progress: { label: "جاري التنفيذ", color: "bg-blue-500/20 text-blue-500", icon: Loader2 },
};

const ClientDigitalOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["digital-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          service:services(id, name, category)
        `)
        .eq("user_id", user.id)
        .ilike("service.category", "%تسويق رقمي%")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter only digital marketing orders
      return (data || []).filter((order: any) => 
        order.service?.category?.includes("تسويق رقمي")
      ) as Order[];
    },
    enabled: !!user,
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = searchQuery
      ? order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.service?.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === "pending").length || 0,
    completed: orders?.filter(o => o.status === "completed").length || 0,
    processing: orders?.filter(o => ["processing", "in_progress"].includes(o.status)).length || 0,
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6 p-4" dir="rtl">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="space-y-6 p-4" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/digital-services"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">طلبات التسويق الرقمي</h1>
              <p className="text-sm text-muted-foreground">
                سجل طلباتك من خدمات التسويق الرقمي
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "إجمالي الطلبات", value: stats.total, icon: Package, color: "from-blue-500 to-indigo-500" },
            { label: "قيد الانتظار", value: stats.pending, icon: Clock, color: "from-amber-500 to-orange-500" },
            { label: "جاري التنفيذ", value: stats.processing, icon: TrendingUp, color: "from-cyan-500 to-blue-500" },
            { label: "مكتمل", value: stats.completed, icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
          ].map((stat, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الطلب أو اسم الخدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="processing">جاري التنفيذ</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {filteredOrders.length === 0 ? (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">لا توجد طلبات</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  لم تقم بأي طلبات من خدمات التسويق الرقمي بعد
                </p>
                <Button onClick={() => navigate("/dashboard/digital-services")}>
                  تصفح الخدمات
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredOrders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => handleViewDetails(order)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-6 h-6 text-blue-500" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{order.service?.name || "خدمة غير معروفة"}</h3>
                              <Badge className={`${status.color} border-0 shrink-0`}>
                                <StatusIcon className="w-3 h-3 ml-1" />
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">{order.order_number}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(order.created_at), "dd MMM yyyy", { locale: ar })}
                              </span>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="text-left shrink-0">
                            <p className="text-lg font-bold text-blue-500">{order.total_price.toFixed(0)} ر.س</p>
                            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 mt-1">
                              <Eye className="w-3 h-3" />
                              التفاصيل
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Order Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                تفاصيل الطلب
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10">
                  <h3 className="font-semibold mb-2">{selectedOrder.service?.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusConfig[selectedOrder.status]?.color} border-0`}>
                      {statusConfig[selectedOrder.status]?.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-mono">
                      {selectedOrder.order_number}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs mb-1">السعر</p>
                    <p className="font-semibold">{selectedOrder.total_price.toFixed(2)} ر.س</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs mb-1">الكمية</p>
                    <p className="font-semibold">{selectedOrder.quantity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs mb-1">تاريخ الطلب</p>
                    <p className="font-semibold">
                      {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs mb-1">آخر تحديث</p>
                    <p className="font-semibold">
                      {format(new Date(selectedOrder.updated_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </p>
                  </div>
                </div>

                {selectedOrder.link && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs mb-1">الرابط</p>
                    <a 
                      href={selectedOrder.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline break-all"
                    >
                      {selectedOrder.link}
                    </a>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs mb-1">ملاحظات</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => {
                    setDetailsOpen(false);
                    navigate(`/dashboard/orders/${selectedOrder.id}`);
                  }}
                >
                  عرض التفاصيل الكاملة
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDigitalOrders;
