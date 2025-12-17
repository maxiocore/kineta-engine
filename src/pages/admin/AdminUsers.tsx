import { motion } from "framer-motion";
import { Users, Search, Filter, MoreVertical, CheckCircle, XCircle, Shield, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const users = [
  { id: 1, name: "محمد أحمد", email: "mohamed@example.com", role: "عميل", status: "موثّق", orders: 12, joined: "15 نوفمبر 2024" },
  { id: 2, name: "سارة الأحمد", email: "sara@example.com", role: "عميل مميز", status: "موثّق", orders: 28, joined: "10 أكتوبر 2024" },
  { id: 3, name: "خالد العلي", email: "khalid@example.com", role: "عميل", status: "غير موثّق", orders: 3, joined: "1 ديسمبر 2024" },
  { id: 4, name: "نورة محمد", email: "noura@example.com", role: "عميل", status: "موثّق", orders: 8, joined: "20 سبتمبر 2024" },
  { id: 5, name: "أحمد الخالد", email: "ahmad@example.com", role: "مشرف", status: "موثّق", orders: 0, joined: "1 يناير 2024" },
];

const AdminUsers = () => {
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
              إدارة المستخدمين
            </motion.h1>
            <p className="text-muted-foreground">عرض وإدارة جميع المستخدمين</p>
          </div>
          <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground">
            <Users className="w-4 h-4 ms-2" />
            إضافة مستخدم
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: "إجمالي المستخدمين", value: "2,543", color: "from-primary to-cyan-400" },
            { label: "مستخدمين موثّقين", value: "2,100", color: "from-success to-emerald-400" },
            { label: "في انتظار التوثيق", value: "443", color: "from-warning to-orange-400" },
            { label: "مشرفين", value: "8", color: "from-accent to-pink-400" },
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
                    <Users className="w-full h-full text-primary-foreground" />
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
                <Input placeholder="البحث بالاسم أو البريد..." className="pr-10 bg-secondary/50" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                تصفية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display">قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">المستخدم</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">الدور</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">الطلبات</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">تاريخ التسجيل</th>
                    <th className="text-right py-4 px-4 font-medium text-muted-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.role === "مشرف" ? "default" : "secondary"}>
                          {user.role === "مشرف" && <Shield className="w-3 h-3 ms-1" />}
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === "موثّق" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}>
                          {user.status === "موثّق" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium">{user.orders}</td>
                      <td className="py-4 px-4 text-muted-foreground">{user.joined}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" title="إرسال بريد">
                            <Mail className="w-4 h-4" />
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
    </AdminDashboardLayout>
  );
};

export default AdminUsers;