import { motion } from "framer-motion";
import { ShoppingBag, Search, Filter, Eye, MoreVertical, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const orders = [
  { id: "#1245", client: "محمد أحمد", service: "تصميم هوية بصرية", status: "جديد", date: "اليوم", price: "2,500 ر.س" },
  { id: "#1244", client: "سارة الأحمد", service: "إدارة وسائل التواصل", status: "قيد التنفيذ", date: "أمس", price: "2,000 ر.س" },
  { id: "#1243", client: "خالد العلي", service: "تحسين SEO", status: "قيد المراجعة", date: "منذ يومين", price: "3,500 ر.س" },
  { id: "#1242", client: "نورة محمد", service: "حملة إعلانية", status: "مكتمل", date: "منذ 3 أيام", price: "5,000 ر.س" },
  { id: "#1241", client: "أحمد الخالد", service: "تصميم موقع", status: "مكتمل", date: "منذ 5 أيام", price: "8,000 ر.س" },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "جديد": return { color: "bg-primary/10 text-primary", icon: AlertCircle };
    case "قيد التنفيذ": return { color: "bg-warning/10 text-warning", icon: Clock };
    case "قيد المراجعة": return { color: "bg-accent/10 text-accent", icon: Eye };
    case "مكتمل": return { color: "bg-success/10 text-success", icon: CheckCircle };
    default: return { color: "bg-muted text-muted-foreground", icon: Clock };
  }
};

const AdminOrders = () => {
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
            { label: "طلبات جديدة", value: "23", color: "from-primary to-cyan-400" },
            { label: "قيد التنفيذ", value: "45", color: "from-warning to-orange-400" },
            { label: "قيد المراجعة", value: "12", color: "from-accent to-pink-400" },
            { label: "مكتملة هذا الشهر", value: "156", color: "from-success to-emerald-400" },
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

        {/* Search & Filter */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="البحث في الطلبات..." className="pr-10 bg-secondary/50" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                تصفية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display">قائمة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {orders.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-4 px-4 font-medium">{order.id}</td>
                        <td className="py-4 px-4">{order.client}</td>
                        <td className="py-4 px-4">{order.service}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3" />
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{order.date}</td>
                        <td className="py-4 px-4 font-medium">{order.price}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminOrders;