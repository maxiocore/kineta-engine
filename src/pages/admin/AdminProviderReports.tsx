import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

interface Provider {
  id: string;
  name: string;
  name_ar: string;
  is_active: boolean;
  services_count: number;
}

interface ProviderStats {
  providerId: string;
  providerName: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  successRate: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminProviderReports = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch providers
    const { data: providersData } = await supabase
      .from('api_providers')
      .select('id, name, name_ar, is_active, services_count')
      .order('name');

    if (providersData) {
      setProviders(providersData);
      
      // Fetch orders with service and provider info
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_price,
          services (
            id,
            provider_id
          )
        `);

      if (ordersData) {
        // Calculate stats per provider
        const statsMap = new Map<string, ProviderStats>();
        
        // Initialize stats for all providers
        providersData.forEach(provider => {
          statsMap.set(provider.id, {
            providerId: provider.id,
            providerName: provider.name_ar || provider.name,
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            successRate: 0
          });
        });

        // Add "No Provider" stats
        statsMap.set('none', {
          providerId: 'none',
          providerName: 'بدون مزود',
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          successRate: 0
        });

        // Calculate stats
        ordersData.forEach(order => {
          const service = order.services as any;
          const providerId = service?.provider_id || 'none';
          
          const stats = statsMap.get(providerId);
          if (stats) {
            stats.totalOrders++;
            stats.totalRevenue += order.total_price || 0;
            
            if (order.status === 'completed') {
              stats.completedOrders++;
            } else if (order.status === 'pending' || order.status === 'in_progress') {
              stats.pendingOrders++;
            } else if (order.status === 'cancelled' || order.status === 'refunded') {
              stats.cancelledOrders++;
            }
          }
        });

        // Calculate success rates
        statsMap.forEach(stats => {
          if (stats.totalOrders > 0) {
            stats.successRate = Math.round((stats.completedOrders / stats.totalOrders) * 100);
          }
        });

        setProviderStats(Array.from(statsMap.values()).filter(s => s.totalOrders > 0));
      }
    }
    
    setLoading(false);
  };

  const totalStats = {
    orders: providerStats.reduce((sum, s) => sum + s.totalOrders, 0),
    revenue: providerStats.reduce((sum, s) => sum + s.totalRevenue, 0),
    completed: providerStats.reduce((sum, s) => sum + s.completedOrders, 0),
    providers: providers.filter(p => p.is_active).length
  };

  const ordersChartData = providerStats.map(s => ({
    name: s.providerName,
    الطلبات: s.totalOrders,
    مكتمل: s.completedOrders,
    ملغي: s.cancelledOrders
  }));

  const revenueChartData = providerStats.map(s => ({
    name: s.providerName,
    الإيرادات: s.totalRevenue
  }));

  const pieChartData = providerStats.map(s => ({
    name: s.providerName,
    value: s.totalOrders
  }));

  const successRateData = providerStats.map(s => ({
    name: s.providerName,
    'نسبة النجاح': s.successRate
  }));

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              تقارير المزودين
            </h1>
            <p className="text-muted-foreground">إحصائيات وتقارير أداء كل مزود</p>
          </div>
          <Link to="/admin/providers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة للمزودين
            </Button>
          </Link>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-cyan-400 p-2.5 shadow-lg">
                  <Package className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.orders}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-success to-emerald-400 p-2.5 shadow-lg">
                  <DollarSign className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalStats.revenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-pink-400 p-2.5 shadow-lg">
                  <CheckCircle className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.completed}</p>
                  <p className="text-xs text-muted-foreground">طلبات مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning to-orange-400 p-2.5 shadow-lg">
                  <Activity className="w-full h-full text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.providers}</p>
                  <p className="text-xs text-muted-foreground">مزود نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Provider */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  الطلبات حسب المزود
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="الطلبات" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="مكتمل" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="ملغي" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Revenue by Provider */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  الإيرادات حسب المزود
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'الإيرادات']}
                    />
                    <Bar dataKey="الإيرادات" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Distribution Pie */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  توزيع الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Success Rate */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  نسبة النجاح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={successRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                      formatter={(value: number) => [`${value}%`, 'نسبة النجاح']}
                    />
                    <Bar dataKey="نسبة النجاح" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Provider Details Table */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>تفاصيل المزودين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right p-3 font-medium text-muted-foreground">المزود</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">الطلبات</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">مكتمل</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">قيد التنفيذ</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">ملغي</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">الإيرادات</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">نسبة النجاح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerStats.map((stats, index) => (
                      <tr key={stats.providerId} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-3 font-medium">{stats.providerName}</td>
                        <td className="p-3 text-center">{stats.totalOrders}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-success/10 text-success">
                            {stats.completedOrders}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-warning/10 text-warning">
                            {stats.pendingOrders}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-destructive/10 text-destructive">
                            {stats.cancelledOrders}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-medium">${stats.totalRevenue.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="outline" 
                            className={stats.successRate >= 80 ? "bg-success/10 text-success" : stats.successRate >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}
                          >
                            {stats.successRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminProviderReports;
