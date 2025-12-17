import { motion } from "framer-motion";
import { Package, Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const services = [
  { id: 1, name: "تصميم هوية بصرية", category: "التصميم", price: "2,500 ر.س", status: "نشط", orders: 45 },
  { id: 2, name: "إدارة وسائل التواصل", category: "التسويق", price: "2,000 ر.س/شهر", status: "نشط", orders: 38 },
  { id: 3, name: "تحسين محركات البحث", category: "التسويق", price: "3,500 ر.س", status: "نشط", orders: 32 },
  { id: 4, name: "إدارة الحملات الإعلانية", category: "الإعلانات", price: "5,000 ر.س", status: "نشط", orders: 28 },
  { id: 5, name: "تصميم موقع إلكتروني", category: "التطوير", price: "8,000 ر.س", status: "معلّق", orders: 15 },
];

const AdminServices = () => {
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
              إدارة الخدمات
            </motion.h1>
            <p className="text-muted-foreground">إضافة وتعديل الخدمات المقدمة</p>
          </div>
          <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground">
            <Plus className="w-4 h-4 ms-2" />
            إضافة خدمة
          </Button>
        </div>

        {/* Search & Filter */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="البحث في الخدمات..." className="pr-10 bg-secondary/50" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                تصفية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass border-border/50 hover:border-primary/30 transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-3">
                      <Package className="w-full h-full text-primary-foreground" />
                    </div>
                    <Badge variant={service.status === "نشط" ? "default" : "secondary"}>
                      {service.status}
                    </Badge>
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{service.category}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-primary">{service.price}</span>
                    <span className="text-sm text-muted-foreground">{service.orders} طلب</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 ms-1" />
                      عرض
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 ms-1" />
                      تعديل
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServices;