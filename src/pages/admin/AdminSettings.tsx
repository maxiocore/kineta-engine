import { motion } from "framer-motion";
import { Settings, Globe, Palette, Bell, Shield, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";

const AdminSettings = () => {
  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-bold mb-2"
          >
            إعدادات النظام
          </motion.h1>
          <p className="text-muted-foreground">تكوين وإدارة إعدادات المنصة</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  الإعدادات العامة
                </CardTitle>
                <CardDescription>إعدادات الموقع الأساسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">اسم الموقع</label>
                  <Input defaultValue="ماركت برو" className="bg-secondary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">وصف الموقع</label>
                  <Textarea 
                    defaultValue="منصة تسويق رقمي متكاملة مدعومة بالذكاء الاصطناعي" 
                    className="bg-secondary/50" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">البريد الإلكتروني للتواصل</label>
                  <Input defaultValue="hello@marketpro.com" className="bg-secondary/50" dir="ltr" />
                </div>
                <Button className="bg-gradient-to-l from-destructive to-orange-500 text-primary-foreground">
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  إعدادات الإشعارات
                </CardTitle>
                <CardDescription>تكوين نظام الإشعارات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "إشعارات الطلبات الجديدة", desc: "تنبيه عند استلام طلب جديد" },
                  { label: "إشعارات تسجيل المستخدمين", desc: "تنبيه عند تسجيل مستخدم جديد" },
                  { label: "إشعارات المدفوعات", desc: "تنبيه عند استلام دفعة" },
                  { label: "تقارير يومية", desc: "إرسال ملخص يومي بالبريد" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  إعدادات الأمان
                </CardTitle>
                <CardDescription>تكوين إعدادات الحماية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "التحقق بخطوتين إلزامي", desc: "للمشرفين فقط", checked: true },
                  { label: "تسجيل النشاطات", desc: "حفظ سجل لجميع العمليات", checked: true },
                  { label: "قفل الحساب", desc: "بعد 5 محاولات فاشلة", checked: true },
                  { label: "التحقق من البريد", desc: "إلزامي للتسجيل", checked: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.checked} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* System Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  معلومات النظام
                </CardTitle>
                <CardDescription>حالة النظام والموارد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "إصدار النظام", value: "2.1.0" },
                  { label: "حالة الخادم", value: "يعمل بشكل طبيعي", status: "success" },
                  { label: "استخدام التخزين", value: "45% من 100GB" },
                  { label: "آخر نسخة احتياطية", value: "منذ ساعتين" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-medium ${item.status === "success" ? "text-success" : ""}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <Button variant="outline" className="w-full">إنشاء نسخة احتياطية</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSettings;