import { motion } from "framer-motion";
import {
  ShoppingBag,
  TrendingUp,
  Bell,
  Clock,
  ArrowUpLeft,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

const stats = [
  {
    title: "الطلبات النشطة",
    value: "5",
    change: "+2 هذا الأسبوع",
    icon: ShoppingBag,
    color: "from-primary to-cyan-400",
  },
  {
    title: "قيد التنفيذ",
    value: "3",
    change: "سيتم الانتهاء قريباً",
    icon: Clock,
    color: "from-warning to-orange-400",
  },
  {
    title: "مكتملة",
    value: "12",
    change: "+4 هذا الشهر",
    icon: TrendingUp,
    color: "from-success to-emerald-400",
  },
  {
    title: "إشعارات جديدة",
    value: "8",
    change: "3 غير مقروءة",
    icon: Bell,
    color: "from-accent to-pink-400",
  },
];

const recentOrders = [
  { id: "#1234", service: "تصميم هوية بصرية", status: "قيد التنفيذ", date: "اليوم" },
  { id: "#1233", service: "إدارة حملات إعلانية", status: "مكتمل", date: "أمس" },
  { id: "#1232", service: "تحسين محركات البحث", status: "قيد المراجعة", date: "منذ يومين" },
  { id: "#1231", service: "إدارة وسائل التواصل", status: "مكتمل", date: "منذ 3 أيام" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "مكتمل":
      return "bg-success/10 text-success";
    case "قيد التنفيذ":
      return "bg-warning/10 text-warning";
    case "قيد المراجعة":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const ClientDashboard = () => {
  return (
    <ClientDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-bold mb-2"
          >
            مرحباً، محمد! 👋
          </motion.h1>
          <p className="text-muted-foreground">إليك نظرة عامة على حسابك اليوم</p>
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
                    <ArrowUpLeft className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-3xl font-bold font-display mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-primary mt-2">{stat.change}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">آخر الطلبات</CardTitle>
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  عرض الكل
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.service}</p>
                        <p className="text-sm text-muted-foreground">{order.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-muted-foreground hidden sm:block">{order.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass border-border/50 bg-gradient-to-l from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold mb-1">هل تحتاج مساعدة؟</h3>
                  <p className="text-muted-foreground">فريق الدعم متاح على مدار الساعة</p>
                </div>
                <Link to="/dashboard/support">
                  <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
                    تواصل مع الدعم
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDashboard;