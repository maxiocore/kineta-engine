import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion } from "framer-motion";
import { 
  Bell, 
  Send, 
  Users, 
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  Megaphone,
  Smartphone,
  Mail,
  Globe,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const notificationStats = [
  { label: "إجمالي الإشعارات", value: "45,892", icon: Bell, color: "from-primary to-primary/70" },
  { label: "المقروءة", value: "42,156", icon: CheckCircle, color: "from-emerald-500 to-green-500" },
  { label: "غير المقروءة", value: "3,736", icon: Clock, color: "from-amber-500 to-yellow-500" },
  { label: "الإعلانات النشطة", value: "8", icon: Megaphone, color: "from-purple-500 to-violet-500" },
];

const systemNotifications = [
  { id: 1, title: "تحديث النظام", message: "تم تحديث النظام للإصدار 2.5.0", type: "تحديث", target: "الجميع", status: "مرسل", date: "منذ ساعة" },
  { id: 2, title: "صيانة مجدولة", message: "سيتم إجراء صيانة الخادم غداً", type: "تنبيه", target: "الجميع", status: "مجدول", date: "منذ 3 ساعات" },
  { id: 3, title: "ميزة جديدة", message: "تم إضافة ميزة الدفع الإلكتروني", type: "إعلان", target: "العملاء", status: "مرسل", date: "منذ يوم" },
  { id: 4, title: "عرض خاص", message: "خصم 20% على جميع الخدمات", type: "ترويج", target: "العملاء", status: "نشط", date: "منذ يومين" },
];

const userNotifications = [
  { id: 1, user: "أحمد محمد", email: "ahmed@example.com", unread: 5, lastSeen: "منذ 10 دقائق" },
  { id: 2, user: "سارة أحمد", email: "sara@example.com", unread: 2, lastSeen: "منذ ساعة" },
  { id: 3, user: "عمر خالد", email: "omar@example.com", unread: 0, lastSeen: "منذ يوم" },
  { id: 4, user: "فاطمة علي", email: "fatima@example.com", unread: 12, lastSeen: "منذ 3 أيام" },
];

const notificationChannels = [
  { id: "push", name: "إشعارات الموقع", icon: Globe, enabled: true, description: "إشعارات داخل المنصة" },
  { id: "email", name: "البريد الإلكتروني", icon: Mail, enabled: true, description: "إرسال إشعارات بالبريد" },
  { id: "mobile", name: "تطبيق الجوال", icon: Smartphone, enabled: false, description: "إشعارات تطبيق الجوال" },
];

const AdminNotifications = () => {
  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">الإشعارات المتقدمة</h1>
            <p className="text-muted-foreground mt-1">إدارة الإشعارات والإعلانات النظامية</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span>إشعار جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء إشعار جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الإشعار</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">معلومات</SelectItem>
                        <SelectItem value="warning">تنبيه</SelectItem>
                        <SelectItem value="success">نجاح</SelectItem>
                        <SelectItem value="promo">ترويج</SelectItem>
                        <SelectItem value="announcement">إعلان</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الفئة المستهدفة</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المستخدمين</SelectItem>
                        <SelectItem value="clients">العملاء فقط</SelectItem>
                        <SelectItem value="admins">المديرين فقط</SelectItem>
                        <SelectItem value="verified">الموثقين فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان الإشعار</label>
                  <Input placeholder="عنوان الإشعار" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">محتوى الإشعار</label>
                  <Textarea placeholder="محتوى الإشعار..." className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">قنوات الإرسال</label>
                  <div className="flex flex-wrap gap-3">
                    {notificationChannels.map((channel) => (
                      <label key={channel.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked={channel.enabled} className="rounded" />
                        <span className="text-sm">{channel.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline">جدولة</Button>
                  <Button className="gap-2">
                    <Send className="w-4 h-4" />
                    إرسال الآن
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {notificationStats.map((stat, index) => (
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

        {/* Tabs */}
        <Tabs defaultValue="system" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="system" className="gap-2">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">النظام</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">المستخدمين</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          {/* System Notifications */}
          <TabsContent value="system">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  إشعارات النظام
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="بحث..." className="pr-9 w-48" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === "تحديث" ? "bg-blue-500/20 text-blue-500" :
                          notification.type === "تنبيه" ? "bg-amber-500/20 text-amber-500" :
                          notification.type === "إعلان" ? "bg-purple-500/20 text-purple-500" :
                          "bg-emerald-500/20 text-emerald-500"
                        }`}>
                          {notification.type === "تحديث" ? <Info className="w-5 h-5" /> :
                           notification.type === "تنبيه" ? <AlertCircle className="w-5 h-5" /> :
                           <Megaphone className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{notification.target}</Badge>
                        <Badge variant={
                          notification.status === "مرسل" ? "default" : 
                          notification.status === "نشط" ? "default" : 
                          "secondary"
                        }>
                          {notification.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground hidden md:block">{notification.date}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Notifications */}
          <TabsContent value="users">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  إشعارات المستخدمين
                </CardTitle>
                <Button variant="outline" className="gap-2">
                  <Bell className="w-4 h-4" />
                  إرسال للجميع
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userNotifications.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                          <span className="text-primary-foreground font-bold">{user.user.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.user}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-bold text-lg">{user.unread}</p>
                          <p className="text-xs text-muted-foreground">غير مقروءة</p>
                        </div>
                        <span className="text-sm text-muted-foreground hidden md:block">{user.lastSeen}</span>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Send className="w-4 h-4" />
                          إرسال
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    قنوات الإشعارات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <channel.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-sm text-muted-foreground">{channel.description}</p>
                        </div>
                      </div>
                      <Switch defaultChecked={channel.enabled} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    إعدادات الإشعارات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium">إشعارات الطلبات الجديدة</p>
                      <p className="text-sm text-muted-foreground">إشعار عند استلام طلب جديد</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium">إشعارات المستخدمين الجدد</p>
                      <p className="text-sm text-muted-foreground">إشعار عند تسجيل مستخدم جديد</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium">إشعارات الدعم الفني</p>
                      <p className="text-sm text-muted-foreground">إشعار عند فتح تذكرة دعم</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="font-medium">التقارير الأسبوعية</p>
                      <p className="text-sm text-muted-foreground">إرسال تقرير أسبوعي بالبريد</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminNotifications;
