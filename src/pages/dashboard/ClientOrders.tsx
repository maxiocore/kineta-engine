import { motion } from "framer-motion";
import { ShoppingBag, Search, Filter, Eye, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

const orders = [
  { id: "#1234", service: "تصميم هوية بصرية", status: "قيد التنفيذ", date: "15 ديسمبر 2024", price: "2,500 ر.س" },
  { id: "#1233", service: "إدارة حملات إعلانية", status: "مكتمل", date: "10 ديسمبر 2024", price: "4,000 ر.س" },
  { id: "#1232", service: "تحسين محركات البحث", status: "قيد المراجعة", date: "5 ديسمبر 2024", price: "3,500 ر.س" },
  { id: "#1231", service: "إدارة وسائل التواصل", status: "مكتمل", date: "1 ديسمبر 2024", price: "2,000 ر.س" },
  { id: "#1230", service: "تصميم موقع إلكتروني", status: "مكتمل", date: "25 نوفمبر 2024", price: "8,000 ر.س" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "مكتمل": return "bg-success/10 text-success";
    case "قيد التنفيذ": return "bg-warning/10 text-warning";
    case "قيد المراجعة": return "bg-primary/10 text-primary";
    default: return "bg-muted text-muted-foreground";
  }
};

const ClientOrders = () => {
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
          <Button className="bg-gradient-primary hover:opacity-90">
            <ShoppingBag className="w-4 h-4 ms-2" />
            طلب جديد
          </Button>
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

        {/* Orders List */}
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
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">الخدمة</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">التاريخ</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">السعر</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">{order.id}</td>
                      <td className="py-4 px-4">{order.service}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientOrders;