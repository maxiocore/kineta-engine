import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ArrowRight, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  ShoppingCart, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Package,
  MessageSquare,
  Activity,
  DollarSign,
  TrendingUp,
  FileText,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import UserAnalyticsCharts from '@/components/admin/UserAnalyticsCharts';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  quantity: number;
  link: string | null;
  created_at: string;
  service: {
    name: string;
    category: string;
  };
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

interface UserRole {
  role: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
    case 'confirmed':
      return { label: 'مؤكد', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle };
    case 'in_progress':
      return { label: 'قيد التنفيذ', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Loader2 };
    case 'completed':
      return { label: 'مكتمل', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle };
    case 'cancelled':
      return { label: 'ملغي', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle };
    case 'refunded':
      return { label: 'مسترد', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: RefreshCw };
    default:
      return { label: status, color: 'bg-muted text-muted-foreground', icon: AlertCircle };
  }
};

const getTicketStatusConfig = (status: string) => {
  switch (status) {
    case 'open':
      return { label: 'مفتوحة', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    case 'in_progress':
      return { label: 'قيد المعالجة', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    case 'resolved':
      return { label: 'تم الحل', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
    case 'closed':
      return { label: 'مغلقة', color: 'bg-muted text-muted-foreground border-muted' };
    default:
      return { label: status, color: 'bg-muted text-muted-foreground border-muted' };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'low':
      return { label: 'منخفضة', color: 'bg-green-500/10 text-green-500' };
    case 'medium':
      return { label: 'متوسطة', color: 'bg-yellow-500/10 text-yellow-500' };
    case 'high':
      return { label: 'عالية', color: 'bg-orange-500/10 text-orange-500' };
    case 'urgent':
      return { label: 'عاجلة', color: 'bg-red-500/10 text-red-500' };
    default:
      return { label: priority, color: 'bg-muted text-muted-foreground' };
  }
};

const AdminUserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalTickets: 0,
    openTickets: 0
  });

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        toast.error('لم يتم العثور على المستخدم');
        navigate('/admin/users');
        return;
      }

      setUser(profileData);

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      setUserRole(roleData?.role || 'user');

      // Fetch orders with service info
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_price,
          quantity,
          link,
          created_at,
          service:services(name, category)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch support tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Fetch audit logs for this user
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`user_id.eq.${userId},record_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setAuditLogs(logsData || []);

      // Calculate stats
      const totalSpent = ordersData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
      const pendingOrders = ordersData?.filter(o => ['pending', 'confirmed', 'in_progress'].includes(o.status)).length || 0;
      const openTickets = ticketsData?.filter(t => ['open', 'in_progress'].includes(t.status)).length || 0;

      setStats({
        totalOrders: ordersData?.length || 0,
        totalSpent,
        completedOrders,
        pendingOrders,
        totalTickets: ticketsData?.length || 0,
        openTickets
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT': return 'إنشاء';
      case 'UPDATE': return 'تحديث';
      case 'DELETE': return 'حذف';
      default: return action;
    }
  };

  const getTableLabel = (table: string) => {
    switch (table) {
      case 'orders': return 'طلب';
      case 'profiles': return 'ملف شخصي';
      case 'support_tickets': return 'تذكرة دعم';
      case 'services': return 'خدمة';
      case 'system_settings': return 'إعدادات';
      default: return table;
    }
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminDashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/users')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ملف المستخدم</h1>
            <p className="text-muted-foreground">عرض تفاصيل وسجل المستخدم</p>
          </div>
        </div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">{user.full_name || 'بدون اسم'}</h2>
                    <Badge variant="outline" className={userRole === 'admin' ? 'border-primary text-primary' : ''}>
                      <Shield className="h-3 w-3 ml-1" />
                      {userRole === 'admin' ? 'مدير' : 'مستخدم'}
                    </Badge>
                    {user.is_verified ? (
                      <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        موثق
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                        <AlertCircle className="h-3 w-3 ml-1" />
                        غير موثق
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      انضم {formatDistanceToNow(new Date(user.created_at), { locale: ar, addSuffix: true })}
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={fetchUserData}>
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">إجمالي الإنفاق</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
                <p className="text-xs text-muted-foreground">طلبات مكتملة</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                <p className="text-xs text-muted-foreground">طلبات قيد التنفيذ</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats.totalTickets}</p>
                <p className="text-xs text-muted-foreground">تذاكر الدعم</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{stats.openTickets}</p>
                <p className="text-xs text-muted-foreground">تذاكر مفتوحة</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              الطلبات ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              التذاكر ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              سجل النشاط ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <UserAnalyticsCharts orders={orders} userCreatedAt={user.created_at} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  سجل الطلبات
                </CardTitle>
                <CardDescription>جميع طلبات المستخدم مرتبة حسب التاريخ</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد طلبات</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم الطلب</TableHead>
                          <TableHead>الخدمة</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>المبلغ</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => {
                          const statusConfig = getStatusConfig(order.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">
                                {order.order_number}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium truncate max-w-[200px]">
                                    {order.service?.name || 'خدمة محذوفة'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.service?.category}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{order.quantity?.toLocaleString()}</TableCell>
                              <TableCell className="font-medium">
                                ${Number(order.total_price).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusConfig.color}>
                                  <StatusIcon className="h-3 w-3 ml-1" />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  تذاكر الدعم
                </CardTitle>
                <CardDescription>جميع تذاكر الدعم الفني للمستخدم</CardDescription>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد تذاكر دعم</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الموضوع</TableHead>
                          <TableHead>الأولوية</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket) => {
                          const statusConfig = getTicketStatusConfig(ticket.status);
                          const priorityConfig = getPriorityConfig(ticket.priority);
                          return (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">
                                {ticket.subject}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={priorityConfig.color}>
                                  {priorityConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  سجل النشاط
                </CardTitle>
                <CardDescription>آخر 50 نشاط للمستخدم في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد سجل نشاط</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {auditLogs.map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className={`p-2 rounded-full ${
                            log.action === 'INSERT' ? 'bg-green-500/10 text-green-500' :
                            log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            <Activity className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {getActionLabel(log.action)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {getTableLabel(log.table_name)}
                              </Badge>
                            </div>
                            {log.new_value && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {JSON.stringify(log.new_value).slice(0, 100)}...
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(log.created_at), { locale: ar, addSuffix: true })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminUserProfile;
