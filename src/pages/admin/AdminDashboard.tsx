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
  Zap,
  Target,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const stats = [
  { 
    title: "إجمالي المستخدمين", 
    value: "2,543", 
    change: "+12%", 
    up: true, 
    icon: Users, 
    gradient: "from-primary via-cyan-400 to-primary",
    shadowColor: "shadow-primary/20"
  },
  { 
    title: "الطلبات الجديدة", 
    value: "156", 
    change: "+23%", 
    up: true, 
    icon: ShoppingBag, 
    gradient: "from-success via-emerald-400 to-success",
    shadowColor: "shadow-success/20"
  },
  { 
    title: "الإيرادات الشهرية", 
    value: "125,000 ر.س", 
    change: "+18%", 
    up: true, 
    icon: DollarSign, 
    gradient: "from-warning via-orange-400 to-warning",
    shadowColor: "shadow-warning/20"
  },
  { 
    title: "معدل التحويل", 
    value: "3.2%", 
    change: "-2%", 
    up: false, 
    icon: TrendingUp, 
    gradient: "from-accent via-pink-400 to-accent",
    shadowColor: "shadow-accent/20"
  },
];

const recentActivities = [
  { type: "user", message: "مستخدم جديد: سارة الأحمد", time: "منذ 5 دقائق", icon: Users, color: "text-primary" },
  { type: "order", message: "طلب جديد #1245 - تصميم هوية", time: "منذ 15 دقيقة", icon: ShoppingBag, color: "text-success" },
  { type: "payment", message: "دفعة مستلمة: 4,500 ر.س", time: "منذ 30 دقيقة", icon: DollarSign, color: "text-warning" },
  { type: "user", message: "تحقق حساب: محمد علي", time: "منذ ساعة", icon: Target, color: "text-accent" },
  { type: "order", message: "طلب مكتمل #1240", time: "منذ ساعتين", icon: Zap, color: "text-success" },
];

const topServices = [
  { name: "تصميم هوية بصرية", orders: 45, revenue: "112,500 ر.س", growth: "+15%" },
  { name: "إدارة وسائل التواصل", orders: 38, revenue: "76,000 ر.س", growth: "+8%" },
  { name: "تحسين محركات البحث", orders: 32, revenue: "112,000 ر.س", growth: "+22%" },
  { name: "إدارة الحملات الإعلانية", orders: 28, revenue: "140,000 ر.س", growth: "+12%" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminDashboard = () => {
  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🎯
            </motion.span>
            لوحة التحكم
          </h1>
          <p className="text-muted-foreground">نظرة شاملة على أداء المنصة</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className={`card-elevated border-border/30 hover:border-primary/30 transition-all duration-300 ${stat.shadowColor} shadow-lg`}>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-3 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </motion.div>
                    <motion.div 
                      className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                        stat.up 
                          ? "bg-success/10 text-success" 
                          : "bg-destructive/10 text-destructive"
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                    >
                      {stat.up ? <ArrowUpLeft className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {stat.change}
                    </motion.div>
                  </div>
                  <motion.p 
                    className="text-2xl sm:text-3xl font-bold mb-1"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated border-border/30 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Activity className="w-5 h-5 text-primary" />
                  </motion.div>
                  النشاط الأخير
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">
                  عرض الكل
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <motion.div 
                      className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${activity.color}`}
                      whileHover={{ rotate: 10 }}
                    >
                      <activity.icon className="w-5 h-5" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Services */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated border-border/30 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">أفضل الخدمات</CardTitle>
                <Link to="/admin/services">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs">
                    عرض الكل
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {topServices.map((service, index) => (
                  <motion.div 
                    key={service.name} 
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: -4 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span 
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary border border-primary/20"
                        whileHover={{ scale: 1.1 }}
                      >
                        {index + 1}
                      </motion.span>
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.orders} طلب</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-sm text-success block">{service.revenue}</span>
                      <span className="text-xs text-success/70">{service.growth}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30 bg-gradient-to-l from-destructive/5 via-orange-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    إجراءات سريعة
                  </h3>
                  <p className="text-muted-foreground text-sm">إدارة المنصة بسرعة وكفاءة</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Link to="/admin/users">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="gap-2">
                        <Users className="w-4 h-4" />
                        المستخدمين
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/admin/orders">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        الطلبات
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/admin/reports">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground gap-2 shadow-lg shadow-destructive/20">
                        <TrendingUp className="w-4 h-4" />
                        التقارير
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
