import { motion } from "framer-motion";
import { User, Lock, Bell, CreditCard, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";

const ClientSettings = () => {
  return (
    <ClientDashboardLayout>
      <div className="space-y-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-bold mb-2"
          >
            الإعدادات
          </motion.h1>
          <p className="text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  معلومات الحساب
                </CardTitle>
                <CardDescription>تحديث معلوماتك الشخصية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">الاسم الأول</label>
                    <Input defaultValue="محمد" className="bg-secondary/50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">الاسم الأخير</label>
                    <Input defaultValue="أحمد" className="bg-secondary/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">البريد الإلكتروني</label>
                  <Input defaultValue="mohamed@example.com" className="bg-secondary/50" dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">رقم الهاتف</label>
                  <Input defaultValue="+966 55 123 4567" className="bg-secondary/50" dir="ltr" />
                </div>
                <Button className="bg-gradient-primary hover:opacity-90">حفظ التغييرات</Button>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  الأمان
                </CardTitle>
                <CardDescription>تغيير كلمة المرور وإعدادات الأمان</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">كلمة المرور الحالية</label>
                  <Input type="password" placeholder="••••••••" className="bg-secondary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">كلمة المرور الجديدة</label>
                  <Input type="password" placeholder="••••••••" className="bg-secondary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">تأكيد كلمة المرور</label>
                  <Input type="password" placeholder="••••••••" className="bg-secondary/50" />
                </div>
                <Button variant="outline">تحديث كلمة المرور</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Side Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "إشعارات البريد", desc: "تلقي التحديثات عبر البريد" },
                  { label: "إشعارات الطلبات", desc: "تحديثات حالة الطلبات" },
                  { label: "العروض والتخفيضات", desc: "إشعارات العروض الخاصة" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  التحقق بخطوتين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  أضف طبقة إضافية من الأمان لحسابك
                </p>
                <Button variant="outline" className="w-full">تفعيل التحقق بخطوتين</Button>
              </CardContent>
            </Card>

            <Card className="glass border-border/50 border-destructive/30">
              <CardHeader>
                <CardTitle className="font-display text-destructive">منطقة الخطر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  حذف الحساب نهائياً وجميع البيانات المرتبطة
                </p>
                <Button variant="destructive" className="w-full">حذف الحساب</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSettings;