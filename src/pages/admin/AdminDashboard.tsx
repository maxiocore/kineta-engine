import { motion } from "framer-motion";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ArrowUpLeft,
  ArrowDownRight,
  Activity,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const stats = [
  { title: "إجمالي المستخدمين", value: "2,543", change: "+12%", up: true, icon: Users, color: "from-primary to-cyan-400" },
  { title: "الطلبات الجديدة", value: "156", change: "+23%", up: true, icon: ShoppingBag, color: "from-success to-emerald-400" },
  { title: "الإيرادات الشهرية", value: "125,000 ر.س", change: "+18%", up: true, icon: DollarSign, color: "from-warning to-orange-400" },
  { title: "معدل التحويل", value: "3.2%", change: "-2%", up: false, icon: TrendingUp, color: "from-accent to-pink-400" },
];

const recentActivities = [
  { type: "user", message: "مستخدم جديد: سارة الأحمد", time: "منذ 5 دقائق" },
  { type: "order", message: "طلب جديد #1245 - تصميم هوية", time: "منذ 15 دقيقة" },
  { type: "payment", message: "دفعة مستلمة: 4,500 ر.س", time: "منذ 30 دقيقة" },
  { type: "user", message: "تحقق حساب: محمد علي", time: "منذ ساعة" },
  { type: "order", message: "طلب مكتمل #1240", time: "منذ ساعتين" },
];

const topServices = [
  { name: "تصميم هوية بصرية", orders: 45, revenue: "112,500 ر.س" },
  { name: "إدارة وسائل التواصل", orders: 38, revenue: "76,000 ر.س" },
  { name: "تحسين محركات البحث", orders: 32, revenue: "112,000 ر.س" },
  { name: "إدارة الحملات الإعلانية", orders: 28, revenue: "140,000 ر.س" },
];

const AdminDashboard = () => {
  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-bold mb-2"
          >
            لوحة التحكم 🎯
          </motion.h1>
          <p className="text-muted-foreground">نظرة شاملة على أداء المنصة</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-3`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${stat.up ? "text-success" : "text-destructive"}`}>
                      {stat.up ? <ArrowUpLeft className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-display mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  النشاط الأخير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display">أفضل الخدمات</CardTitle>
                <Link to="/admin/services">
                  <Button variant="ghost" size="sm" className="gap-2">
                    عرض الكل
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.orders} طلب</p>
                        </div>
                      </div>
                      <span className="font-medium text-sm text-success">{service.revenue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass border-border/50 bg-gradient-to-l from-destructive/5 to-orange-500/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold mb-1">إجراءات سريعة</h3>
                  <p className="text-muted-foreground">إدارة المنصة بسرعة وكفاءة</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Link to="/admin/users">
                    <Button variant="outline">إدارة المستخدمين</Button>
                  </Link>
                  <Link to="/admin/orders">
                    <Button variant="outline">عرض الطلبات</Button>
                  </Link>
                  <Link to="/admin/reports">
                    <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground">
                      التقارير
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;