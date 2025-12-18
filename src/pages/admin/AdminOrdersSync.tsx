import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  ArrowUpDown,
  ExternalLink,
  Zap,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderWithExternal {
  id: string;
  order_number: string;
  status: string;
  external_order_id: string | null;
  external_status: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
  service: {
    name: string;
  } | null;
}

const AdminOrdersSync = () => {
  const [orders, setOrders] = useState<OrderWithExternal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<{ updated: number; total: number } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoSync) {
      interval = setInterval(() => {
        handleSyncAll();
      }, 60000); // Sync every minute
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSync]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        external_order_id,
        external_status,
        total_price,
        created_at,
        updated_at,
        service:services(name)
      `)
      .not("external_order_id", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب الطلبات");
    } else {
      setOrders(data as unknown as OrderWithExternal[]);
    }
    setLoading(false);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-orders-status", {
        body: {},
      });

      if (error) throw error;

      setLastSync(new Date());
      setSyncResult({ updated: data.synced || 0, total: data.synced + (data.errors || 0) });
      
      if (data.synced > 0) {
        toast.success(`تم تحديث ${data.synced} طلب`);
        fetchOrders();
      } else {
        toast.info("لا توجد تحديثات جديدة");
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error("خطأ في مزامنة الطلبات");
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckSingle = async (externalOrderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-orders-status", {
        body: {},
      });

      if (error) throw error;

      toast.success(`الحالة: ${data.status || "غير متوفر"}`);
    } catch (error: any) {
      console.error("Check error:", error);
      toast.error("خطأ في التحقق من الحالة");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "قيد الانتظار", icon: <Clock className="w-3 h-3" /> },
      confirmed: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "مؤكد", icon: <CheckCircle2 className="w-3 h-3" /> },
      in_progress: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "قيد التنفيذ", icon: <Activity className="w-3 h-3" /> },
      completed: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "مكتمل", icon: <CheckCircle2 className="w-3 h-3" /> },
      cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "ملغي", icon: <AlertCircle className="w-3 h-3" /> },
      refunded: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "مسترد", icon: <AlertCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    inProgress: orders.filter(o => o.status === "in_progress").length,
    completed: orders.filter(o => o.status === "completed").length,
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-2.5">
                <ArrowUpDown className="w-full h-full text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">مزامنة الطلبات الخارجية</h1>
            </motion.div>
            <p className="text-muted-foreground">تتبع وتحديث حالة الطلبات من المزودين الخارجيين</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
              <Label htmlFor="auto-sync" className="text-sm">
                مزامنة تلقائية
              </Label>
            </div>
            <Button
              onClick={handleSyncAll}
              disabled={syncing}
              className="gap-2 bg-gradient-to-l from-cyan-500 to-blue-500"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              مزامنة الكل
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                    <p className="text-2xl font-bold text-purple-400">{stats.inProgress}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مكتمل</p>
                    <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sync Status */}
        {(lastSync || syncResult) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass border-cyan-500/30 bg-cyan-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    {lastSync && (
                      <p className="text-sm text-muted-foreground">
                        آخر مزامنة: {lastSync.toLocaleTimeString("ar-SA")}
                      </p>
                    )}
                    {syncResult && (
                      <p className="text-sm">
                        تم تحديث <span className="text-cyan-400 font-bold">{syncResult.updated}</span> طلب من أصل <span className="font-bold">{syncResult.total}</span>
                      </p>
                    )}
                  </div>
                  {autoSync && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      المزامنة التلقائية مفعلة
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Orders Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              الطلبات المرتبطة بالمزودين الخارجيين
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد طلبات مرتبطة بمزودين خارجيين
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">الخدمة</TableHead>
                      <TableHead className="text-right">ID الخارجي</TableHead>
                      <TableHead className="text-right">الحالة المحلية</TableHead>
                      <TableHead className="text-right">الحالة الخارجية</TableHead>
                      <TableHead className="text-right">آخر تحديث</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.order_number}
                        </TableCell>
                        <TableCell>{order.service?.name || "-"}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {order.external_order_id}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {order.external_status ? (
                            <Badge variant="outline" className="font-mono">
                              {order.external_status}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.updated_at).toLocaleString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckSingle(order.external_order_id!)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminOrdersSync;
