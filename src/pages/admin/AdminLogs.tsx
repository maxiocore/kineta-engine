import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion } from "framer-motion";
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  Shield,
  Settings,
  ShoppingBag,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const logStats = [
  { label: "إجمالي العمليات", value: "125,847", icon: Activity, color: "from-primary to-primary/70" },
  { label: "عمليات اليوم", value: "1,234", icon: Clock, color: "from-blue-500 to-cyan-500" },
  { label: "تنبيهات أمنية", value: "23", icon: AlertTriangle, color: "from-amber-500 to-yellow-500" },
  { label: "أخطاء النظام", value: "5", icon: XCircle, color: "from-destructive to-red-500" },
];

const activityLogs = [
  { id: 1, action: "تسجيل دخول", user: "أحمد محمد", role: "عميل", ip: "192.168.1.100", status: "نجح", date: "2024-01-15 14:30:25" },
  { id: 2, action: "إنشاء طلب جديد", user: "سارة أحمد", role: "عميل", ip: "192.168.1.101", status: "نجح", date: "2024-01-15 14:28:15" },
  { id: 3, action: "تعديل مستخدم", user: "المدير العام", role: "أدمن", ip: "192.168.1.1", status: "نجح", date: "2024-01-15 14:25:00" },
  { id: 4, action: "محاولة دخول فاشلة", user: "غير معروف", role: "-", ip: "45.33.32.156", status: "فشل", date: "2024-01-15 14:20:30" },
  { id: 5, action: "حذف خدمة", user: "المدير العام", role: "أدمن", ip: "192.168.1.1", status: "نجح", date: "2024-01-15 14:15:45" },
  { id: 6, action: "تغيير كلمة المرور", user: "عمر خالد", role: "عميل", ip: "192.168.1.102", status: "نجح", date: "2024-01-15 14:10:20" },
  { id: 7, action: "إضافة خدمة جديدة", user: "مدير الخدمات", role: "مدير", ip: "192.168.1.2", status: "نجح", date: "2024-01-15 14:05:10" },
  { id: 8, action: "تسجيل خروج", user: "فاطمة علي", role: "عميل", ip: "192.168.1.103", status: "نجح", date: "2024-01-15 14:00:00" },
];

const securityLogs = [
  { id: 1, event: "محاولة دخول متكررة", severity: "عالي", source: "45.33.32.156", details: "5 محاولات فاشلة", date: "2024-01-15 14:20:30" },
  { id: 2, event: "تغيير صلاحيات", severity: "متوسط", source: "المدير العام", details: "ترقية مستخدم لمدير", date: "2024-01-15 13:45:00" },
  { id: 3, event: "وصول من موقع جديد", severity: "منخفض", source: "أحمد محمد", details: "دخول من جهاز جديد", date: "2024-01-15 12:30:15" },
  { id: 4, event: "تعديل إعدادات الأمان", severity: "عالي", source: "المدير العام", details: "تفعيل 2FA", date: "2024-01-15 11:00:00" },
];

const systemLogs = [
  { id: 1, type: "info", message: "تم تشغيل النظام بنجاح", component: "Server", date: "2024-01-15 08:00:00" },
  { id: 2, type: "warning", message: "استخدام الذاكرة مرتفع (85%)", component: "Memory", date: "2024-01-15 12:30:00" },
  { id: 3, type: "error", message: "فشل الاتصال بخادم البريد", component: "Email", date: "2024-01-15 13:15:00" },
  { id: 4, type: "success", message: "تم إكمال النسخ الاحتياطي", component: "Backup", date: "2024-01-15 03:00:00" },
  { id: 5, type: "info", message: "تحديث قاعدة البيانات", component: "Database", date: "2024-01-15 02:00:00" },
];

const getActionIcon = (action: string) => {
  if (action.includes("دخول")) return LogIn;
  if (action.includes("خروج")) return LogOut;
  if (action.includes("إنشاء") || action.includes("إضافة")) return Plus;
  if (action.includes("تعديل") || action.includes("تغيير")) return Edit;
  if (action.includes("حذف")) return Trash2;
  return Activity;
};

const AdminLogs = () => {
  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">سجل العمليات</h1>
            <p className="text-muted-foreground mt-1">تتبع جميع الأنشطة والعمليات في النظام</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              <span>تصدير السجل</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {logStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث في السجلات..." className="pr-9" />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نوع العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="login">تسجيل دخول</SelectItem>
                  <SelectItem value="create">إنشاء</SelectItem>
                  <SelectItem value="update">تعديل</SelectItem>
                  <SelectItem value="delete">حذف</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="admin">أدمن</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="client">عميل</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="success">نجح</SelectItem>
                  <SelectItem value="failed">فشل</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                تحديد التاريخ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">الأنشطة</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">الأمان</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">النظام</span>
            </TabsTrigger>
          </TabsList>

          {/* Activity Logs */}
          <TabsContent value="activity">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  سجل الأنشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLogs.map((log, index) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            log.status === "نجح" ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"
                          }`}>
                            <ActionIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{log.user}</span>
                              <span>•</span>
                              <span>{log.ip}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{log.role}</Badge>
                          <Badge variant={log.status === "نجح" ? "default" : "destructive"}>
                            {log.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground hidden lg:block">{log.date}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline">تحميل المزيد</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Logs */}
          <TabsContent value="security">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  سجل الأمان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.severity === "عالي" ? "bg-destructive/20 text-destructive" :
                          log.severity === "متوسط" ? "bg-amber-500/20 text-amber-500" :
                          "bg-blue-500/20 text-blue-500"
                        }`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{log.event}</p>
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={
                          log.severity === "عالي" ? "destructive" :
                          log.severity === "متوسط" ? "secondary" : "outline"
                        }>
                          {log.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground hidden lg:block">{log.date}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Logs */}
          <TabsContent value="system">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  سجل النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.type === "error" ? "bg-destructive/20 text-destructive" :
                          log.type === "warning" ? "bg-amber-500/20 text-amber-500" :
                          log.type === "success" ? "bg-emerald-500/20 text-emerald-500" :
                          "bg-blue-500/20 text-blue-500"
                        }`}>
                          {log.type === "error" ? <XCircle className="w-5 h-5" /> :
                           log.type === "warning" ? <AlertTriangle className="w-5 h-5" /> :
                           log.type === "success" ? <CheckCircle className="w-5 h-5" /> :
                           <Activity className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{log.message}</p>
                          <p className="text-sm text-muted-foreground">المكون: {log.component}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={
                          log.type === "error" ? "destructive" :
                          log.type === "warning" ? "secondary" :
                          log.type === "success" ? "default" : "outline"
                        }>
                          {log.type === "error" ? "خطأ" :
                           log.type === "warning" ? "تحذير" :
                           log.type === "success" ? "نجاح" : "معلومات"}
                        </Badge>
                        <span className="text-sm text-muted-foreground hidden lg:block">{log.date}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminLogs;
