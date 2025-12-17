import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Users, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const monthlyData = [
  { month: "يناير", revenue: 85000, orders: 120 },
  { month: "فبراير", revenue: 92000, orders: 135 },
  { month: "مارس", revenue: 78000, orders: 98 },
  { month: "أبريل", revenue: 105000, orders: 156 },
  { month: "مايو", revenue: 118000, orders: 178 },
  { month: "يونيو", revenue: 125000, orders: 195 },
];

const AdminReports = () => {
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

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
              التقارير والإحصائيات
            </motion.h1>
            <p className="text-muted-foreground">تحليل شامل لأداء المنصة</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              آخر 6 أشهر
            </Button>
            <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "إجمالي الإيرادات", value: "603,000 ر.س", change: "+18%", icon: DollarSign, color: "from-success to-emerald-400" },
            { title: "إجمالي الطلبات", value: "882", change: "+24%", icon: BarChart3, color: "from-primary to-cyan-400" },
            { title: "عملاء جدد", value: "234", change: "+12%", icon: Users, color: "from-accent to-pink-400" },
            { title: "معدل النمو", value: "23%", change: "+5%", icon: TrendingUp, color: "from-warning to-orange-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-3`}>
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </div>
                    <span className="text-sm text-success font-medium">{stat.change}</span>
                  </div>
                  <p className="text-2xl font-bold font-display mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display">الإيرادات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={data.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{data.month}</span>
                      <span className="text-muted-foreground">{data.revenue.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-l from-destructive to-orange-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader>
                <CardTitle className="font-display">أفضل الخدمات أداءً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "إدارة الحملات الإعلانية", percentage: 85 },
                    { name: "تصميم هوية بصرية", percentage: 72 },
                    { name: "تحسين محركات البحث", percentage: 68 },
                    { name: "إدارة وسائل التواصل", percentage: 55 },
                  ].map((service, index) => (
                    <div key={service.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span className="text-primary font-medium">{service.percentage}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${service.percentage}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-primary rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader>
                <CardTitle className="font-display">مصادر العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { source: "البحث العضوي", percentage: 40, color: "bg-primary" },
                    { source: "وسائل التواصل", percentage: 30, color: "bg-accent" },
                    { source: "الإعلانات المدفوعة", percentage: 20, color: "bg-warning" },
                    { source: "الإحالات", percentage: 10, color: "bg-success" },
                  ].map((source, index) => (
                    <div key={source.source} className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${source.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{source.source}</span>
                          <span className="text-sm font-medium">{source.percentage}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${source.percentage}%` }}
                            transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                            className={`h-full rounded-full ${source.color}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminReports;