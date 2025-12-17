import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion } from "framer-motion";
import { 
  Mail, 
  Send, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Inbox,
  Archive,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const emailStats = [
  { label: "إجمالي المرسل", value: "12,458", icon: Send, color: "from-primary to-primary/70" },
  { label: "تم التسليم", value: "11,892", icon: CheckCircle, color: "from-emerald-500 to-green-500" },
  { label: "في الانتظار", value: "342", icon: Clock, color: "from-amber-500 to-yellow-500" },
  { label: "فشل الإرسال", value: "224", icon: XCircle, color: "from-destructive to-red-500" },
];

const emailTemplates = [
  { id: 1, name: "ترحيب بالمستخدم الجديد", type: "تلقائي", usage: 2456, status: "نشط" },
  { id: 2, name: "تأكيد الطلب", type: "تلقائي", usage: 1893, status: "نشط" },
  { id: 3, name: "استعادة كلمة المرور", type: "تلقائي", usage: 567, status: "نشط" },
  { id: 4, name: "إشعار الدفع", type: "تلقائي", usage: 1234, status: "نشط" },
  { id: 5, name: "نشرة أسبوعية", type: "حملة", usage: 890, status: "مسودة" },
  { id: 6, name: "عرض خاص", type: "حملة", usage: 456, status: "متوقف" },
];

const recentEmails = [
  { id: 1, to: "ahmed@example.com", subject: "مرحباً بك في ماركت برو", template: "ترحيب", status: "تم التسليم", date: "منذ 5 دقائق" },
  { id: 2, to: "sara@example.com", subject: "تأكيد طلبك #12345", template: "تأكيد الطلب", status: "تم التسليم", date: "منذ 15 دقيقة" },
  { id: 3, to: "omar@example.com", subject: "استعادة كلمة المرور", template: "استعادة", status: "في الانتظار", date: "منذ 20 دقيقة" },
  { id: 4, to: "fatima@example.com", subject: "عرض خاص لك", template: "حملة", status: "فشل", date: "منذ 30 دقيقة" },
  { id: 5, to: "khaled@example.com", subject: "إشعار دفع جديد", template: "إشعار", status: "تم التسليم", date: "منذ ساعة" },
];

const AdminEmails = () => {
  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">إدارة البريد الإلكتروني</h1>
            <p className="text-muted-foreground mt-1">إدارة الرسائل والقوالب والحملات البريدية</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span>إنشاء رسالة جديدة</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء رسالة بريد جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الرسالة</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">مستخدم واحد</SelectItem>
                        <SelectItem value="group">مجموعة</SelectItem>
                        <SelectItem value="all">جميع المستخدمين</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">القالب</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قالب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">مخصص</SelectItem>
                        <SelectItem value="welcome">ترحيب</SelectItem>
                        <SelectItem value="promo">عرض ترويجي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المستلم</label>
                  <Input placeholder="البريد الإلكتروني أو اختر مجموعة" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">العنوان</label>
                  <Input placeholder="عنوان الرسالة" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المحتوى</label>
                  <Textarea placeholder="محتوى الرسالة..." className="min-h-[150px]" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline">حفظ كمسودة</Button>
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
          {emailStats.map((stat, index) => (
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
        <Tabs defaultValue="sent" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="sent" className="gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">المرسلة</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">القوالب</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">الحملات</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">الواردة</span>
            </TabsTrigger>
          </TabsList>

          {/* Sent Emails */}
          <TabsContent value="sent">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  الرسائل المرسلة
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
                  {recentEmails.map((email, index) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{email.subject}</p>
                          <p className="text-sm text-muted-foreground">{email.to}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={email.status === "تم التسليم" ? "default" : email.status === "في الانتظار" ? "secondary" : "destructive"}>
                          {email.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground hidden md:block">{email.date}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates">
            <Card className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  قوالب البريد
                </CardTitle>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  قالب جديد
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emailTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{template.type}</Badge>
                        <Badge variant={template.status === "نشط" ? "default" : template.status === "مسودة" ? "secondary" : "destructive"}>
                          {template.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        تم الاستخدام {template.usage} مرة
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns */}
          <TabsContent value="campaigns">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  الحملات البريدية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد حملات نشطة حالياً</p>
                  <Button className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    إنشاء حملة جديدة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox */}
          <TabsContent value="inbox">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="w-5 h-5" />
                  صندوق الوارد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد رسائل واردة</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminEmails;
